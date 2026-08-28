/**
 * Does SELECT DISTINCT work over LIST and STRUCT columns, treat NULLs as equal, and
 * reorder rows? (Yes, yes, and yes - hence the order-safety guard on distinct().)
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/distinct-types.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:'); const c = await i.connect();
async function q(label, sql) {
  try { const r = await c.run(sql); const rows = await r.getRowObjectsJson();
    console.log(`OK   ${label}: ${rows.length} rows ${JSON.stringify(rows).slice(0,150)}`);
  } catch (e) { console.log(`ERR  ${label}: ${e.message.split('\n')[0]}`); }
}
// DISTINCT over LIST / STRUCT columns - the frame's configs routinely have arrays and objects
await c.run(`CREATE TABLE t AS SELECT * FROM (VALUES
  ('a', ['x','y'], {'k':'v'}), ('a', ['x','y'], {'k':'v'}), ('b', ['z'], {'k':'w'})
) v(name, tags, meta)`);
await q('DISTINCT * with LIST + STRUCT', 'SELECT DISTINCT * FROM t');
await q('DISTINCT on LIST alone', 'SELECT DISTINCT tags FROM t');
await q('DISTINCT on STRUCT alone', 'SELECT DISTINCT meta FROM t');
// nulls: does DISTINCT treat NULLs as equal? (DataFrame's unique should agree)
await c.run(`CREATE TABLE n AS SELECT * FROM (VALUES (1,NULL),(1,NULL),(2,NULL)) v(a,b)`);
await q('DISTINCT with NULL columns', 'SELECT DISTINCT * FROM n');
// Does DISTINCT destroy ordering? 2M rows, 14 threads.
await c.run('CREATE TABLE big AS SELECT n AS id, n % 1000000 AS x FROM range(2000000) tbl(n)');
const conn = await i.connect();
const p = await conn.stream('SELECT x FROM (SELECT DISTINCT x FROM (SELECT * FROM big ORDER BY x))');
let prev = -1, bad = 0, seen = 0;
for (;;) { const ch = await p.fetchChunk(); if (!ch || ch.rowCount === 0) break;
  for (const v of ch.getColumnValues(0)) { const nv = Number(v); if (nv < prev) bad++; prev = nv; seen++; } }
console.log(`\nDISTINCT over an ordered subquery: ${seen} rows, ${bad} out of order`);
conn.disconnectSync();
// The real expand-values `false` shape: SUM of list lengths, each field in its own block
await q('stacked expansion via UNION ALL',
  `SELECT name, unnest(tags) AS tag, NULL::VARCHAR AS m FROM t WHERE name='a' LIMIT 1
   UNION ALL SELECT name, NULL, meta.k FROM t WHERE name='a' LIMIT 1`);
// does unnest drop a row whose list is empty, and can that be avoided?
await c.run(`CREATE TABLE e AS SELECT * FROM (VALUES ('keep', ['p']), ('empty', []::VARCHAR[]), ('null', NULL)) v(id, tags)`);
await q('plain unnest drops empty/null', 'SELECT id, unnest(tags) AS t FROM e');
await q('unnest with empty->[NULL] coalesce',
  `SELECT id, unnest(CASE WHEN tags IS NULL OR len(tags) = 0 THEN [NULL]::VARCHAR[] ELSE tags END) AS t FROM e`);
c.disconnectSync(); i.closeSync();
