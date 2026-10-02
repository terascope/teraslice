/* eslint-disable no-console -- a probe's output IS its result */
// GEOMETRY: append with an explicit type, number normalisation, precision. VARIANT vs JSON timing.
import { DuckDBInstance, geometryValue, GEOMETRY } from '@duckdb/node-api';
const c = await (await DuckDBInstance.create(':memory:')).connect();
await c.run('LOAD spatial');
const q = async (s) => (await c.runAndReadAll(s)).getRows();
const shape = { type: 'Point', coordinates: [1.123456789012345, -2.000000000000001] };
const [[wkb]] = await q(`SELECT ST_AsWKB(ST_GeomFromGeoJSON('${JSON.stringify(shape)}'))`);
await c.run('CREATE TABLE g (g GEOMETRY)');
try {
    const a = await c.createAppender('g');
    a.appendValue(geometryValue(wkb.bytes), GEOMETRY);
    a.endRow();
    a.flushSync();
    a.closeSync();
    console.log('appendValue(geometryValue, GEOMETRY): OK', JSON.stringify(await q('SELECT ST_AsGeoJSON(g)::VARCHAR FROM g')));
} catch (e) {
    console.log('appendValue with type: FAIL', e.message.split('\n')[0]);
}
for (const s of ['{"type":"Point","coordinates":[1,2]}', JSON.stringify(shape), '{"type":"Polygon","coordinates":[[[0,0],[10,0],[10,10],[0,0]]]}']) {
    const [[raw, norm]] = await q(`WITH t AS (SELECT ST_GeomFromGeoJSON('${s}') g) SELECT ST_AsGeoJSON(g)::VARCHAR, ST_AsGeoJSON(g)::JSON::VARCHAR FROM t`);
    console.log(`${norm === s ? 'ok  ' : 'DIFF'} in=${s}\n     ST_AsGeoJSON=${raw}\n     ::JSON      =${norm}`);
}

const N = 1_000_000;
const time = async (label, sql) => {
    const t = process.hrtime.bigint();
    await c.run(sql);
    console.log(`${label.padEnd(34)} ${Number(process.hrtime.bigint() - t) / 1e6 | 0} ms`);
};
await time('build JSON column', `CREATE TABLE j AS SELECT json_object('a', i, 'b', 'x' || (i % 100), 'c', [i, i + 1]) v FROM range(${N}) r(i)`);
await time('build VARIANT column (from JSON)', 'CREATE TABLE vv AS SELECT v::VARIANT v FROM j');
await time('JSON: filter on a key', `CREATE OR REPLACE TEMP TABLE o AS SELECT count(*) FROM j WHERE (v->>'a')::BIGINT > ${N / 2}`);
await time('VARIANT: filter on a key', `CREATE OR REPLACE TEMP TABLE o AS SELECT count(*) FROM vv WHERE variant_extract(v, 'a')::BIGINT > ${N / 2}`);
await time('JSON: render as JSON text', 'CREATE OR REPLACE TEMP TABLE o AS SELECT sum(strlen(v::VARCHAR)) FROM j');
await time('VARIANT: render as JSON text', 'CREATE OR REPLACE TEMP TABLE o AS SELECT sum(strlen(v::JSON::VARCHAR)) FROM vv');
console.log('bytes: JSON', JSON.stringify(await q('SELECT estimated_size FROM duckdb_tables() WHERE table_name IN (\'j\',\'vv\') ORDER BY table_name')));
process.exit(0);
