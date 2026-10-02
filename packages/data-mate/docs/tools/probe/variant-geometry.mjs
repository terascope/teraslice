/* eslint-disable no-console -- a probe's output IS its result */
// VARIANT (for Any / untyped Object) and GEOMETRY (for GeoJSON): can we write them from JS, read
// them back exactly, render JSON identical to DataFrame, and survive the Parquet wire?
import {
    DuckDBInstance, geometryValue,
} from '@duckdb/node-api';
import { DataFrame } from '../../../dist/src/index.js';
import { FieldType as T } from '@terascope/types';

const dir = process.argv[2];
const inst = await DuckDBInstance.create(':memory:');
const c = await inst.connect();
const q = async (sql) => (await c.runAndReadAll(sql));
const tryQ = async (label, sql) => {
    try {
        const r = await q(sql);
        console.log(label, JSON.stringify(r.getRowsJson()));
        return r;
    } catch (e) {
        console.log(label, 'FAIL', e.message.split('\n')[0]);
    }
};
const PRESERVE = {
    useNullForUndefined: true,
    skipNilValues: false,
    skipEmptyObjects: false,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

console.log('\n### 1. VARIANT: append from JS');
const ANY = [
    { a: 1, b: 'x' },
    'plain',
    12,
    1.5,
    true,
    9007199254740993n,
    -9223372036854775808n,
    { nested: { deep: [1, 2, { k: null }] } },
    {},
    [],
    [1, 'mixed', false],
    { n: null },
];
// DataChunk + VARIANT SEGFAULTS (variant-append-modes.mjs), and appendVariant cannot infer a
// container's type, so load through SQL from JSON text - bigints written as exact digits.
const exactJSON = (x) => JSON.stringify(x, (_, y) => (typeof y === 'bigint' ? `@@${y}@@` : y)).replace(/"@@(-?\d+)@@"/g, '$1');
await q('CREATE TABLE v (i INTEGER, v VARIANT)');
for (const [i, x] of ANY.entries()) await q(`INSERT INTO v SELECT ${i}, '${exactJSON(x)}'::JSON::VARIANT`);
console.log('  loaded via SQL ::JSON::VARIANT');
await tryQ('  variant_typeof', 'SELECT i, variant_typeof(v) FROM v ORDER BY i');

console.log('\n### 2. VARIANT: JSON rendering vs DataFrame (Any column)');
const df = DataFrame.fromJSON(
    { version: 1, fields: { v: { type: T.Any } } },
    ANY.map((v) => ({ v }))
);
let dfLines;
try {
    dfLines = df.toJSON(PRESERVE).map((r) => JSON.stringify(r.v));
} catch (e) {
    dfLines = `DataFrame.toJSON THREW: ${e.message}`;
}
const duckLines = (await q('SELECT v::JSON::VARCHAR FROM v ORDER BY i')).getRows().map((r) => r[0]);
ANY.forEach((x, i) => {
    const d = Array.isArray(dfLines) ? dfLines[i] : dfLines;
    console.log(`  ${d === duckLines[i] ? 'ok  ' : 'DIFF'} df=${d}  duck=${duckLines[i]}`);
});

console.log('\n### 3. VARIANT: what rows() would hand back (binding values)');
const rr = await q('SELECT v FROM v ORDER BY i');
rr.getRows().forEach(([x], i) => console.log(`  ${i}: ${x?.constructor?.name} inner=${x?.value?.constructor?.name} str=${String(x)}`));

console.log('\n### 4. VARIANT over Parquet');
await q(`COPY v TO '${dir}/variant.parquet' (FORMAT parquet, COMPRESSION zstd)`);
const back = (await q(`SELECT v::JSON::VARCHAR, variant_typeof(v) FROM '${dir}/variant.parquet' ORDER BY i`)).getRows();
back.forEach(([j, t], i) => console.log(`  ${j === duckLines[i] ? 'ok  ' : 'DIFF'} ${t}: ${j}${j === duckLines[i] ? '' : `  (was ${duckLines[i]})`}`));

console.log('\n### 5. GEOMETRY: GeoJSON in, GeoJSON out, vs DataFrame');
await q('LOAD spatial');
const SHAPES = [
    { type: 'Point', coordinates: [-90.5, 22.5] },
    { type: 'Point', coordinates: [1, 2] },
    { type: 'point', coordinates: [1.123456789012345, -2.000000000000001] },
    { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[2, 2], [4, 2], [4, 4], [2, 2]]] },
    { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]], [[[5, 5], [6, 5], [6, 6], [5, 5]]]] },
];
const gdf = DataFrame.fromJSON(
    { version: 1, fields: { g: { type: T.GeoJSON } } },
    SHAPES.map((g) => ({ g }))
);
const gWant = gdf.toJSON(PRESERVE).map((r) => JSON.stringify(r.g));
for (const [i, s] of SHAPES.entries()) {
    const lit = `'${JSON.stringify(s)}'`;
    try {
        const [[out]] = (await q(`SELECT ST_AsGeoJSON(ST_GeomFromGeoJSON(${lit}))::VARCHAR`)).getRows();
        console.log(`  ${out === gWant[i] ? 'ok  ' : 'DIFF'} df=${gWant[i]}\n        duck=${out}`);
    } catch (e) {
        console.log(`  FAIL df=${gWant[i]}\n        duck: ${e.message.split('\n')[0]}`);
    }
}

console.log('\n### 6. GEOMETRY: append from JS (the binding takes WKB only)');
await q('CREATE TABLE g (g GEOMETRY)');
const [[wkb]] = (await q(`SELECT ST_AsWKB(ST_GeomFromGeoJSON('${JSON.stringify(SHAPES[0])}'))`)).getRows();
try {
    const app = await c.createAppender('g');
    app.appendValue(geometryValue(wkb.bytes ?? wkb));
    app.endRow();
    app.flushSync();
    app.closeSync();
    console.log('  appendValue(geometryValue(WKB)): OK ->', JSON.stringify((await q('SELECT ST_AsGeoJSON(g)::VARCHAR FROM g')).getRows()));
} catch (e) {
    console.log('  appendValue(geometryValue(WKB)): FAIL', e.message.split('\n')[0]);
}
await tryQ('  GeoJSON text -> GEOMETRY cast, no spatial fn', `SELECT '${JSON.stringify(SHAPES[0])}'::GEOMETRY`);
await tryQ('  WKT text -> GEOMETRY cast', `SELECT ST_AsGeoJSON('POINT(1 2)'::GEOMETRY)::VARCHAR`);
process.exit(0);
