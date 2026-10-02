/* eslint-disable no-console -- a probe's output IS its result */
// A GEOMETRY[] column reads back off Parquet as BLOB[]. Which write option, or which read-side
// conversion, brings it back as GEOMETRY[] exactly?
import { DuckDBInstance } from '@duckdb/node-api';
const dir = process.argv[2];
const c = await (await DuckDBInstance.create(':memory:')).connect();
const q = async (s) => (await c.runAndReadAll(s)).getRows();
const tryQ = async (label, s) => {
    try {
        console.log(`  ok   ${label}: ${JSON.stringify(await q(s))}`);
    } catch (e) {
        console.log(`  FAIL ${label}: ${e.message.split('\n')[0]}`);
    }
};
await c.run(`CREATE TABLE t AS SELECT 'POINT(1.5 2.5)'::GEOMETRY g, ['POINT(1.5 2.5)'::GEOMETRY, 'POINT(3.5 4.5)'::GEOMETRY] gs,
    {'inner': 'POINT(5.5 6.5)'::GEOMETRY} st`);
console.log('settings:', JSON.stringify(await q(`SELECT name, value FROM duckdb_settings() WHERE name ILIKE '%geo%'`)));
for (const opt of ['', ', GEOPARQUET_VERSION \'V1\'', ', GEOPARQUET_VERSION \'V2\'', ', GEOPARQUET_VERSION \'BOTH\'', ', GEOPARQUET_VERSION \'NONE\'']) {
    const file = `${dir}/glist${opt.replace(/\W/g, '')}.parquet`;
    try {
        await c.run(`COPY t TO '${file}' (FORMAT parquet${opt})`);
        const types = await q(`SELECT column_name, column_type FROM (DESCRIBE SELECT * FROM '${file}')`);
        console.log(`COPY${opt || ' (default)'} -> ${JSON.stringify(types)}`);
    } catch (e) {
        console.log(`COPY${opt} FAIL ${e.message.split('\n')[0]}`);
    }
}
const file = `${dir}/glist.parquet`;
await tryQ('implicit BLOB[] -> GEOMETRY[] on INSERT', `CREATE TABLE u (gs GEOMETRY[]); INSERT INTO u SELECT gs FROM '${file}'; SELECT gs::VARCHAR FROM u`);
await tryQ('explicit CAST BLOB -> GEOMETRY', `SELECT (gs[1])::GEOMETRY FROM '${file}'`);
await tryQ('core ST_GeomFromWKB (no spatial)', `SELECT list_transform(gs, lambda b : ST_GeomFromWKB(b)) FROM '${file}'`);
await c.run('LOAD spatial');
await tryQ('spatial ST_GeomFromWKB', `SELECT list_transform(gs, lambda b : ST_GeomFromWKB(b))::VARCHAR FROM '${file}'`);
process.exit(0);
