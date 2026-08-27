/**
 * Does a DuckDB appender participate in the connection transaction? (Yes - ROLLBACK
 * removes rows it had already flushed, which is what makes append() atomic.)
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/append-transaction.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance, DuckDBDataChunk } = await duckdb();
const i = await DuckDBInstance.create(':memory:'); const c = await i.connect();
await c.run('CREATE TABLE t (a INTEGER)');
await c.run('INSERT INTO t VALUES (1)');

// Does an appender participate in the connection's transaction?
const types = (await c.run('SELECT * FROM t LIMIT 0')).columnTypes();
await c.run('BEGIN TRANSACTION');
const app = await c.createAppender('t');
const chunk = DuckDBDataChunk.create(types, 2);
chunk.setColumns([[2, 3]]);
app.appendDataChunk(chunk);
app.flushSync();
let mid = await (await c.run('SELECT count(*) AS n FROM t')).getRowObjectsJson();
console.log('inside txn after flush:', JSON.stringify(mid));
app.closeSync();
await c.run('ROLLBACK');
let after = await (await c.run('SELECT count(*) AS n FROM t')).getRowObjectsJson();
console.log('after ROLLBACK        :', JSON.stringify(after), '(1 means the appender IS transactional)');

// and a committed one
await c.run('BEGIN TRANSACTION');
const app2 = await c.createAppender('t');
const chunk2 = DuckDBDataChunk.create(types, 1);
chunk2.setColumns([[9]]);
app2.appendDataChunk(chunk2);
app2.flushSync(); app2.closeSync();
await c.run('COMMIT');
console.log('after COMMIT          :', JSON.stringify(await (await c.run('SELECT count(*) AS n FROM t')).getRowObjectsJson()));

// INSERT ... SELECT count returned?
console.log('INSERT returns        :', JSON.stringify(await (await c.run('INSERT INTO t VALUES (5),(6)')).getRowObjectsJson()));
c.disconnectSync(); i.closeSync();
