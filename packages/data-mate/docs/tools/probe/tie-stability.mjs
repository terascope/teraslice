/**
 * A tie-heavy ORDER BY is NOT deterministic in DuckDB, so paging over one duplicates and
 * drops rows. DataFrame is stable (Array#sort). A unique tiebreaker fixes it.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/tie-stability.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:');
const c = await i.connect();
const N = 2_000_000;
// `bucket` is tie-heavy on purpose: 20 distinct values over 2M rows = 100k rows per tie group.
await c.run(`CREATE TABLE t AS SELECT n AS id, n % 20 AS bucket FROM range(${N}) tbl(n)`);
const s = await c.run("SELECT current_setting('threads') AS t");
console.log('threads:', (await s.getRowObjectsJson())[0].t);

async function page(sql) {
    const r = await c.run(sql);
    return (await r.getRowObjectsJson()).map((x) => Number(x.id));
}

// Is a tie-heavy ORDER BY stable (ties in insertion order)?
const head = await page('SELECT id FROM t ORDER BY bucket LIMIT 10');
console.log('\nORDER BY bucket LIMIT 10, ids:', head.join(','));
console.log('  (stable would be 0,20,40,60,80,100,120,140,160,180 - bucket 0 in insertion order)');

// Does the SAME query return the SAME page across evaluations?
const runs = new Set();
for (let n = 0; n < 20; n++) runs.add((await page('SELECT id FROM t ORDER BY bucket LIMIT 10')).join(','));
console.log(`\nsame LIMIT 10 query, 20 runs -> ${runs.size} distinct results`);
for (const r of runs) console.log('   ', r);

// The paging question: do page 1 and page 2 partition the rows, or overlap/drop?
const p1 = new Set(), p2 = new Set();
for (let n = 0; n < 10; n++) {
    (await page('SELECT id FROM t ORDER BY bucket LIMIT 1000')).forEach((x) => p1.add(x));
    (await page('SELECT id FROM t ORDER BY bucket LIMIT 1000 OFFSET 1000')).forEach((x) => p2.add(x));
}
console.log(`\npage1 over 10 runs: ${p1.size} distinct ids (1000 if deterministic)`);
console.log(`page2 over 10 runs: ${p2.size} distinct ids (1000 if deterministic)`);
const overlap = [...p1].filter((x) => p2.has(x));
console.log(`rows appearing in BOTH pages: ${overlap.length}`);

// With a unique tiebreaker appended:
const tb = new Set();
for (let n = 0; n < 20; n++) tb.add((await page('SELECT id FROM t ORDER BY bucket, id LIMIT 10')).join(','));
console.log(`\nwith a unique tiebreaker (ORDER BY bucket, id), 20 runs -> ${tb.size} distinct result(s):`);
for (const r of tb) console.log('   ', r);
c.disconnectSync(); i.closeSync();
