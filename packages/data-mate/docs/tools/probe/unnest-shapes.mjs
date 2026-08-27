/**
 * The two expand_values shapes: several unnest() in one SELECT zip positionally (padding
 * with NULL), one per FROM entry cross-products. Also: unnest DROPS rows whose list is []/NULL.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/unnest-shapes.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:'); const c = await i.connect();
await c.run(`CREATE TABLE t AS SELECT * FROM (VALUES
  ('r1', ['a','b','c'], [1,2]),
  ('r2', ['d'], [9,8,7]),
  ('r3', [], [5]),
  ('r4', NULL, [3])
) v(id, tags, nums)`);
async function q(label, sql) {
  try { const r = await c.run(sql); console.log(`\n${label}\n  ${sql}`);
    for (const row of await r.getRowObjectsJson()) console.log('   ', JSON.stringify(row));
  } catch (e) { console.log(`\n${label}\n  ERR: ${e.message.split('\n')[0]}`); }
}
await q('single-field unnest', 'SELECT id, unnest(tags) AS tag FROM t');
await q('two unnests in ONE select (correlated / zipped?)', 'SELECT id, unnest(tags) AS tag, unnest(nums) AS num FROM t');
await q('two unnests cross-product via lateral', 'SELECT id, tag, num FROM t, unnest(tags) AS x(tag), unnest(nums) AS y(num)');
await q('empty list and NULL rows survive?', 'SELECT id, unnest(tags) AS tag FROM t WHERE id IN (\'r3\',\'r4\')');
c.disconnectSync(); i.closeSync();
