/**
 * Can a join of two very large tables be STREAMED out, without materialising the result?
 *
 * `join-shapes.mjs` measures the join itself. This measures the thing that decides whether a
 * billion-row join is viable at all: whether the result can be pulled a chunk at a time with
 * memory staying flat, or whether something in the path accumulates.
 *
 * **The join KEY's cardinality decides everything, so it is the axis.** A join on a unique key is
 * 1:1 and emits N rows. A join on a key with C distinct values emits roughly N*N/C - so at
 * N = 1e9 and C = 1e6 that is 1e12 rows, which no amount of streaming makes viable. The question
 * "can we stream a 1B x 1B join" therefore has two different answers and this reports both.
 *
 * Peak RSS is sampled DURING the drain, not after, because the failure mode being looked for is
 * accumulation while rows are in flight.
 *
 *     cd packages/data-mate && npx tsc -b
 *     node docs/tools/bench/join-stream.mjs
 *     N=25000000 node docs/tools/bench/join-stream.mjs
 *     MEM=8GiB N=10000000 node docs/tools/bench/join-stream.mjs   # squeeze it deliberately
 */
import { rm } from 'node:fs/promises';
import { duckdb, heading, note } from '../lib/duck.mjs';

const N = Number(process.env.N || 10_000_000);
const MEM = process.env.MEM || '24GiB';
const TH = process.env.THREADS || String(navigator.hardwareConcurrency ?? 8);
const SPOOL = process.env.SPOOL || '/tmp/duck-join-spool';
const DB = process.env.DB || '/tmp/duck-join.db';

const { DuckDBInstance } = await duckdb();
await rm(DB, { force: true });
await rm(`${DB}.wal`, { force: true });
await rm(SPOOL, { recursive: true, force: true });

const inst = await DuckDBInstance.create(DB, { threads: TH, memory_limit: MEM });
const conn = await inst.connect();
await conn.run(`SET temp_directory = '${SPOOL}'`);
await conn.run('SET preserve_insertion_order = false');
await conn.run("SET max_temp_directory_size = '400GiB'");

const mb = (b) => `${(b / 1024 / 1024).toFixed(0)} MB`;
const num = (n) => Math.round(n).toLocaleString();

heading(`JOIN STREAM: ${num(N)} x ${num(N)}, memory_limit ${MEM}, ${TH} threads`);

/**
 * Two tables of N rows with three join keys of different cardinality, so one build serves every
 * shape. `range()` generates server-side - no JavaScript in the ingest path at all, which keeps
 * this measuring the join rather than record generation.
 */
note('building both sides with range() - no JavaScript in the ingest path');
let mark = process.hrtime.bigint();
for (const side of ['a', 'b']) {
    await conn.run(`CREATE OR REPLACE TABLE ${side} AS
        SELECT i AS unique_key,
               i % 1000000 AS mid_key,
               i % 1000 AS low_key,
               'v' || (i % 97) AS payload
        FROM range(${N}) t(i)`);
}
note(`built in ${(Number(process.hrtime.bigint() - mark) / 1e9).toFixed(1)} s`);
await conn.run('CHECKPOINT');

/** Drains a streaming result chunk by chunk, sampling RSS while rows are in flight. */
async function drain(sql) {
    const before = process.memoryUsage().rss;
    let peak = before;
    let rows = 0;
    const start = process.hrtime.bigint();

    const reader = await conn.stream(sql);
    for (;;) {
        const chunk = await reader.fetchChunk();
        if (!chunk || chunk.rowCount === 0) break;
        rows += chunk.rowCount;
        const rss = process.memoryUsage().rss;
        if (rss > peak) peak = rss;
    }

    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    return { rows, ms, before, peak };
}

heading('STREAMING the join result, by key cardinality');
note('key              distinct     out rows        ms       rows/s    rss before -> peak');

for (const [key, distinct] of [['unique_key', N], ['mid_key', 1_000_000], ['low_key', 1_000]]) {
    const sql = `SELECT a.unique_key, a.payload, b.payload AS bp`
        + ` FROM a JOIN b ON a.${key} = b.${key}`;

    // a low-cardinality key is quadratic: N*N/C rows. Cap it so the script finishes.
    const expected = (N * N) / distinct;
    if (expected > 2e9) {
        note(`${key.padEnd(14)}${num(distinct).padStart(11)}`
            + `   SKIPPED - would emit ~${num(expected)} rows (N*N/C)`);
        continue;
    }

    try {
        const r = await drain(sql);
        note(`${key.padEnd(14)}${num(distinct).padStart(11)}${num(r.rows).padStart(13)}`
            + `${r.ms.toFixed(0).padStart(10)}${num(r.rows / (r.ms / 1000)).padStart(13)}`
            + `    ${mb(r.before)} -> ${mb(r.peak)}`);
    } catch (err) {
        note(`${key.padEnd(14)}${num(distinct).padStart(11)}   FAILED: `
            + String(err.message).split('\n')[0].slice(0, 60));
    }
}

heading('SPILL');
const spill = await conn.run(
    "SELECT current_setting('temp_directory'), current_setting('max_temp_directory_size')"
);
note(JSON.stringify((await spill.getRowsJson())[0]));
note(`final rss ${mb(process.memoryUsage().rss)}`);

await rm(DB, { force: true });
await rm(`${DB}.wal`, { force: true });
await rm(SPOOL, { recursive: true, force: true });
process.exit(0);
