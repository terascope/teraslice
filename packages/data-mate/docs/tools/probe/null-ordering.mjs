/**
 * DuckDB's default_null_order, which is NULLS_LAST for BOTH directions - unlike
 * DataFrame, which sorts a nil as the SMALLEST value (first asc, last desc).
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/null-ordering.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:'); const c = await i.connect();
const s = await c.run("SELECT current_setting('default_null_order') AS o");
console.log('default_null_order:', JSON.stringify(await s.getRowObjectsJson()));
await c.run("CREATE TABLE t AS SELECT * FROM (VALUES ('a',10),('b',20),('n',NULL)) v(name,bytes)");
for (const q of ['ORDER BY bytes', 'ORDER BY bytes DESC']) {
  const r = await c.run(`SELECT name FROM t ${q}`);
  console.log(q, '->', (await r.getRowObjectsJson()).map(x => x.name).join(','));
}
c.disconnectSync(); i.closeSync();
