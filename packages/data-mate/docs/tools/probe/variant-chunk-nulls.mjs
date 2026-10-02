/* eslint-disable no-console -- a probe's output IS its result */
// Does a table with a VARIANT column break DataChunk ingest even when the VARIANT is all NULL?
import { DuckDBInstance, DuckDBDataChunk } from '@duckdb/node-api';
const step = (s) => process.stdout.write(`${s}... `);
const c = await (await DuckDBInstance.create(':memory:')).connect();
await c.run('CREATE TABLE v (k VARCHAR, v VARIANT)');
const types = (await c.run('SELECT * FROM v LIMIT 0')).columnTypes();
step('DataChunk.create');
const chunk = DuckDBDataChunk.create(types, 2);
console.log('ok');
step('setColumns(nulls)');
chunk.setColumns([['a', 'b'], [null, null]]);
console.log('ok');
step('appendDataChunk');
const a = await c.createAppender('v');
a.appendDataChunk(chunk);
a.flushSync();
a.closeSync();
console.log('ok');
step('then SQL fill');
await c.run(`UPDATE v SET v = '{"x":1}'::JSON::VARIANT WHERE k = 'a'`);
console.log('ok', JSON.stringify((await c.runAndReadAll('SELECT k, v::JSON::VARCHAR FROM v ORDER BY k')).getRows()));
process.exit(0);
