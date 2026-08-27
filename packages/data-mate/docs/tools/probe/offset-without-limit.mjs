/**
 * Is OFFSET valid with no LIMIT, and do direction/nulls keywords behave? (Yes.)
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/offset-without-limit.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:');
const c = await i.connect();
await c.run('CREATE TABLE t AS SELECT n AS id, n % 3 AS g FROM range(10) tbl(n)');
for (const sql of [
  'SELECT * FROM t OFFSET 7',
  'SELECT * FROM t ORDER BY id DESC NULLS LAST LIMIT 3',
  'SELECT * FROM (SELECT * FROM t ORDER BY id) LIMIT 3 OFFSET 2',
]) {
  try {
    const r = await c.run(sql);
    console.log('OK  ', sql, '->', JSON.stringify(await r.getRowObjectsJson()));
  } catch (e) { console.log('ERR ', sql, '->', e.message); }
}
c.disconnectSync(); i.closeSync();
