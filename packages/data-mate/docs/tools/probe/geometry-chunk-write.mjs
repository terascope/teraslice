/* eslint-disable no-console -- a probe's output IS its result */
// Can our ingest path (appender.appendDataChunk) write GEOMETRY from JS? The single-value
// appender call is unimplemented in the binding, but the GEOMETRY VECTOR writer exists.
import { DuckDBInstance, DuckDBDataChunk, geometryValue } from '@duckdb/node-api';
const c = await (await DuckDBInstance.create(':memory:')).connect();
await c.run('LOAD spatial');
// hand-built little-endian WKB, no DuckDB involved: Point(1 2)
const pt = new Uint8Array(21);
const dv = new DataView(pt.buffer);
dv.setUint8(0, 1);
dv.setUint32(1, 1, true);
dv.setFloat64(5, 1, true);
dv.setFloat64(13, 2, true);
await c.run('CREATE TABLE g (id INTEGER, g GEOMETRY)');
const types = (await c.run('SELECT * FROM g LIMIT 0')).columnTypes();
const chunk = DuckDBDataChunk.create(types, 3);
chunk.setColumns([[1, 2, 3], [geometryValue(pt), null, geometryValue(pt)]]);
const a = await c.createAppender('g');
a.appendDataChunk(chunk);
a.flushSync();
a.closeSync();
const r = await c.runAndReadAll('SELECT id, ST_AsText(g), ST_X(g), ST_Y(g) FROM g ORDER BY id');
console.log(JSON.stringify(r.getRowsJson()));
await c.run(`COPY g TO '${process.argv[2]}/geom.parquet'`);
const kv = await c.runAndReadAll(`SELECT decode(key), decode(value) FROM parquet_kv_metadata('${process.argv[2]}/geom.parquet')`);
console.log('parquet kv metadata:', JSON.stringify(kv.getRows()).slice(0, 400));
const back = await c.runAndReadAll(`SELECT typeof(g), ST_AsText(g) FROM '${process.argv[2]}/geom.parquet' ORDER BY id`);
console.log('read back:', JSON.stringify(back.getRows()));
process.exit(0);
