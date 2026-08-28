/**
 * read_parquet over a LIST of files, INSERT ... BY NAME vs positional (positional FAILS on
 * a column-order mismatch), and what a missing file does.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/multi-parquet.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
import { tmpdir } from 'node:os'; import { join } from 'node:path';
const i = await DuckDBInstance.create(':memory:'); const c = await i.connect();
const d = tmpdir();
const f1 = join(d, 'mp-1.parquet'), f2 = join(d, 'mp-2.parquet'), f3 = join(d, 'mp-3.parquet');
await c.run(`COPY (SELECT 1 AS a, 'x' AS b) TO '${f1}' (FORMAT parquet, COMPRESSION zstd)`);
await c.run(`COPY (SELECT 2 AS a, 'y' AS b) TO '${f2}' (FORMAT parquet, COMPRESSION zstd)`);
await c.run(`COPY (SELECT 'z' AS b, 3 AS a) TO '${f3}' (FORMAT parquet, COMPRESSION zstd)`); // COLUMN ORDER SWAPPED
async function q(label, sql) {
  try { const r = await c.run(sql); console.log(`OK   ${label}: ${JSON.stringify(await r.getRowObjectsJson())}`); }
  catch (e) { console.log(`ERR  ${label}: ${e.message.split('\n')[0]}`); }
}
await q('read_parquet LIST of files', `SELECT * FROM read_parquet(['${f1}', '${f2}'])`);
await q('CREATE TABLE from a list', `CREATE OR REPLACE TABLE t AS SELECT * FROM read_parquet(['${f1}', '${f2}'])`);
await q('count in table', 'SELECT count(*) AS n FROM t');
await q('INSERT another parquet, plain', `INSERT INTO t SELECT * FROM read_parquet('${f2}')`);
await q('count after insert', 'SELECT count(*) AS n FROM t');
await q('INSERT with SWAPPED column order, plain', `INSERT INTO t SELECT * FROM read_parquet('${f3}')`);
await q('INSERT with SWAPPED column order, BY NAME', `INSERT INTO t BY NAME SELECT * FROM read_parquet('${f3}')`);
await q('final contents', 'SELECT * FROM t ORDER BY a');
await q('read_parquet with a MISSING file in the list', `SELECT * FROM read_parquet(['${f1}', '${join(d,'nope.parquet')}'])`);
c.disconnectSync(); i.closeSync();
