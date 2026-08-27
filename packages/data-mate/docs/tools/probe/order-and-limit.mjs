/**
 * Does nesting ORDER BY in a subquery lose its fusion with an outer LIMIT? (No - the
 * optimiser flattens it: identical TOP_N plan either way.) Also: what plans LIMIT/OFFSET get,
 * and whether streaming stops early.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/order-and-limit.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();

const instance = await DuckDBInstance.create(':memory:');
const conn = await instance.connect();

async function run(sql) { await conn.run(sql); }
async function all(sql) {
    const r = await conn.run(sql);
    return (await r.getRowObjectsJson());
}
async function explain(label, sql) {
    const rows = await all(`EXPLAIN ${sql}`);
    const plan = rows.map((r) => Object.values(r).join(' ')).join('\n');
    const ops = [...plan.matchAll(/│\s+([A-Z_]{3,})\s+│/g)].map((m) => m[1]);
    console.log(`\n=== ${label}`);
    console.log(`    ${sql}`);
    console.log(`    operators: ${[...new Set(ops)].join(' <- ')}`);
    return plan;
}

const N = 5_000_000;
await run(`CREATE TABLE t AS SELECT i AS id, (i * 7919) % ${N} AS x, i::VARCHAR AS s FROM range(${N}) tbl(i)`);
await run(`CREATE TABLE c AS SELECT i AS id, i % 1000 AS k FROM range(1000000) tbl(i)`);

// --- Q1: does ORDER BY + LIMIT in the same block become TOP_N?
await explain('flat: ORDER BY + LIMIT same block', 'SELECT * FROM t ORDER BY x LIMIT 10');
await explain('nested: ORDER BY inner, LIMIT outer', 'SELECT * FROM (SELECT * FROM t ORDER BY x) LIMIT 10');
await explain('nested: ORDER BY inner, WHERE + LIMIT outer', 'SELECT * FROM (SELECT * FROM t ORDER BY x) WHERE id > 5 LIMIT 10');
await explain('flat: WHERE then ORDER BY + LIMIT', 'SELECT * FROM t WHERE id > 5 ORDER BY x LIMIT 10');
await explain('bare LIMIT, no order', 'SELECT * FROM t LIMIT 10');
await explain('LIMIT + OFFSET', 'SELECT * FROM t ORDER BY x LIMIT 10 OFFSET 1000');

// --- Q2: timing, TOP_N vs sort-then-limit
async function time(label, sql) {
    const t0 = process.hrtime.bigint();
    const res = await conn.run(sql);
    const rows = await res.getRowObjectsJson();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`  ${label.padEnd(46)} ${ms.toFixed(0).padStart(6)} ms   ${rows.length} rows`);
    return rows;
}
console.log('\n=== timings (5M rows)');
await time('flat ORDER BY x LIMIT 10', 'SELECT * FROM t ORDER BY x LIMIT 10');
await time('nested (ORDER BY inner, LIMIT outer)', 'SELECT * FROM (SELECT * FROM t ORDER BY x) LIMIT 10');
await time('nested + outer WHERE', 'SELECT * FROM (SELECT * FROM t ORDER BY x) WHERE id > 5 LIMIT 10');
await time('full ORDER BY, no limit (materialized)', 'SELECT id FROM t ORDER BY x');

// --- Q3: does ORDER BY survive a subquery when an operator sits on top?
console.log('\n=== does inner ORDER BY survive an outer operator?');
const ordered = await all('SELECT id, x FROM (SELECT * FROM t WHERE id < 20 ORDER BY x) sub');
console.log('  subquery ORDER BY under plain SELECT *:', ordered.map((r) => r.x).join(','));
const joined = await all(
    'SELECT sub.x FROM (SELECT * FROM t WHERE id < 20 ORDER BY x) sub JOIN c ON sub.id = c.id'
);
console.log('  same subquery under a JOIN            :', joined.map((r) => r.x).join(','));
const grouped = await all(
    'SELECT x, count(*) FROM (SELECT * FROM t WHERE id < 20 ORDER BY x) sub GROUP BY x'
);
console.log('  same subquery under a GROUP BY        :', grouped.map((r) => r.x).join(','));

// --- Q4: early termination. Does a streaming consumer that stops early avoid the work?
console.log('\n=== early termination via streaming (break after 1 chunk)');
async function streamStop(label, sql, chunks = 1) {
    const t0 = process.hrtime.bigint();
    const c2 = await instance.connect();
    const pending = await c2.stream(sql);
    let got = 0;
    for (let i = 0; i < chunks; i++) {
        const chunk = await pending.fetchChunk();
        if (!chunk || chunk.rowCount === 0) break;
        got += chunk.rowCount;
    }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    c2.disconnectSync();
    console.log(`  ${label.padEnd(46)} ${ms.toFixed(0).padStart(6)} ms   ${got} rows read`);
}
await streamStop('stream scan, stop after 1 chunk', 'SELECT * FROM t');
await streamStop('stream scan, read ALL chunks', 'SELECT * FROM t', 1e9);
await streamStop('stream ORDER BY, stop after 1 chunk', 'SELECT * FROM t ORDER BY x');
await streamStop('stream GROUP BY, stop after 1 chunk', 'SELECT x, count(*) FROM t GROUP BY x');
await streamStop('stream ORDER BY + LIMIT 10', 'SELECT * FROM t ORDER BY x LIMIT 10');
await streamStop('stream filter 1-in-5M, stop after 1 chunk', `SELECT * FROM t WHERE x = ${N - 1}`);

conn.disconnectSync();
instance.closeSync();
