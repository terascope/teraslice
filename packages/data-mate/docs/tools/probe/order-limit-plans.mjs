/**
 * Raw EXPLAIN output for the ORDER BY / LIMIT formulations - the evidence behind
 * order-and-limit.mjs, kept because the TOP_N + rowid-semi-join shape is not obvious.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/order-limit-plans.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const instance = await DuckDBInstance.create(':memory:');
const conn = await instance.connect();
await conn.run('CREATE TABLE t AS SELECT i AS id, (i*7919)%1000000 AS x FROM range(1000000) tbl(i)');
for (const sql of [
    'SELECT * FROM t ORDER BY x LIMIT 10',
    'SELECT * FROM (SELECT * FROM t ORDER BY x) LIMIT 10',
    'SELECT * FROM (SELECT * FROM t ORDER BY x LIMIT 10) WHERE id > 5',
    'SELECT * FROM (SELECT * FROM t ORDER BY x) WHERE id > 5 LIMIT 10',
    'SELECT * FROM t LIMIT 10 OFFSET 1000',
]) {
    const r = await conn.run(`EXPLAIN ${sql}`);
    const rows = await r.getRowObjectsJson();
    console.log(`\n########## ${sql}`);
    for (const row of rows) console.log(row.explain_key, '\n', row.explain_value);
}
conn.disconnectSync(); instance.closeSync();
