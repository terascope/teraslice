/**
 * Which operators PRESERVE a subquery ORDER BY. Projection/WHERE/LIMIT/OFFSET keep it;
 * JOIN and GROUP BY scramble it - but only at scale, which is why the guard exists.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/order-preservation.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:');
const c = await i.connect();
const r0 = await c.run("SELECT current_setting('preserve_insertion_order') AS v, current_setting('threads') AS t");
console.log('settings:', JSON.stringify(await r0.getRowObjectsJson()));

const N = 5_000_000;
await c.run(`CREATE TABLE t AS SELECT n AS id, (n*7919)%${N} AS x FROM range(${N}) tbl(n)`);

async function monotonic(label, sql) {
    const conn = await i.connect();
    const p = await conn.stream(sql);
    let prev = -1; let bad = 0; let seen = 0;
    for (;;) {
        const chunk = await p.fetchChunk();
        if (!chunk || chunk.rowCount === 0) break;
        const col = chunk.getColumnValues(0);
        for (const v of col) {
            const n = Number(v);
            if (n < prev) bad++;
            prev = n; seen++;
        }
    }
    conn.disconnectSync();
    console.log(`  ${label.padEnd(52)} rows=${seen} out-of-order=${bad}`);
}
console.log('\n=== is an inner ORDER BY preserved through a downstream operator? (5M rows, streamed)');
await monotonic('ORDER BY x  (baseline)', 'SELECT x FROM t ORDER BY x');
await monotonic('(ORDER BY x) + outer projection', 'SELECT x*1 AS x FROM (SELECT * FROM t ORDER BY x)');
await monotonic('(ORDER BY x) + outer WHERE', 'SELECT x FROM (SELECT * FROM t ORDER BY x) WHERE id % 3 = 0');
await monotonic('(ORDER BY x) + outer LIMIT 1M', 'SELECT x FROM (SELECT * FROM t ORDER BY x) LIMIT 1000000');
await monotonic('(ORDER BY x) + outer OFFSET 100', 'SELECT x FROM (SELECT * FROM t ORDER BY x) OFFSET 100');
await monotonic('(ORDER BY x) under a JOIN', 'SELECT sub.x FROM (SELECT * FROM t ORDER BY x) sub JOIN t o ON sub.id = o.id');
await monotonic('(ORDER BY x) under a GROUP BY', 'SELECT x FROM (SELECT * FROM t ORDER BY x) GROUP BY x');
await c.run('SET preserve_insertion_order = false');
console.log('  -- with preserve_insertion_order = false --');
await monotonic('(ORDER BY x) + outer WHERE', 'SELECT x FROM (SELECT * FROM t ORDER BY x) WHERE id % 3 = 0');
c.disconnectSync(); i.closeSync();
