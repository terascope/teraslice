/**
 * WHICH Parquet query runs out of memory, at what limit, and WHY.
 *
 * `probe/memory-metric.mjs` found that under a tight `memory_limit` a Parquet view fails with an
 * Out of Memory Error where a native table evicts and completes. That is a real difference, but
 * "Parquet OOMs" is not an actionable finding - nobody can act on it without knowing which query
 * shapes trigger it, at what memory-to-data ratio, and what the mechanism is.
 *
 * **The obvious explanation is already ruled out.** DuckDB's `temp_directory` defaults to `.tmp`
 * with `max_temp_directory_size` at 90% of disk, so spilling is available by default and the failure
 * is NOT "it cannot spill".
 *
 * **Stages:**
 *   1. every query INDIVIDUALLY, fresh connection each, over a sweep of limits, both storage kinds -
 *      this says WHICH shapes are fragile and at what ratio
 *   2. the failing shapes again with `threads` varied - Parquet decompression buffers are per-thread,
 *      so if thread count moves the failure point, that is the mechanism
 *   3. the memory breakdown by tag at the moment of failure, which says WHAT is holding the budget
 *
 * Each cell runs in its own process: a failed allocation can leave an instance in a state that would
 * contaminate the next measurement.
 *
 * Run:  node packages/data-mate/docs/tools/probe/parquet-memory-limits.mjs
 */
import { stat, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const run = promisify(execFile);
const ROWS = Number(process.env.ROWS || 10_000_000);
const ROOT = process.env.ROOT || '/tmp/duck-memprobe';
const DB = join(ROOT, 'native.db');
const PQ = join(ROOT, 'corpus.parquet');
const OUT = process.env.OUT || new URL('../results/parquet-limits.json', import.meta.url).pathname;
const CELL = process.env.CELL || null;

const mb = (b) => `${(b / 1048576).toFixed(0)} MB`;

const QUERIES = [
    ['count(*)', 'SELECT count(*) FROM t'],
    ['2 predicates', `SELECT count(*) FROM t WHERE "active" = true AND "category" = 'gamma'`],
    ['range + eq', `SELECT count(*) FROM t WHERE "amount" BETWEEN 100 AND 5000 AND "status" = 'active'`],
    ['text prefix', `SELECT count(*) FROM t WHERE "email" LIKE 'user1%'`],
    ['IN list', `SELECT count(*) FROM t WHERE "category" IN ('alpha','gamma')`],
    ['top 100 sorted', 'SELECT * FROM t WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],
    ['agg 1 key', 'SELECT "category", count(*), sum("amount"), avg("score") FROM t GROUP BY 1'],
    ['agg 2 keys', 'SELECT "category", "status", count(*), sum("amount"), max("score") FROM t GROUP BY 1, 2'],
    ['agg high-card', 'SELECT "name", count(*) FROM t GROUP BY 1'],
    ['agg filtered+ordered', `SELECT "category", sum("amount") AS total FROM t WHERE "active" = true GROUP BY 1 ORDER BY total DESC LIMIT 20`],
    ['count distinct', 'SELECT count(DISTINCT "name") FROM t'],
    ['approx distinct', 'SELECT approx_count_distinct("name") FROM t'],
    ['quantiles', 'SELECT quantile_cont("amount", [0.5, 0.9, 0.99]) FROM t'],
    ['project 1 col', 'SELECT sum("amount") FROM t'],
    ['project all cols', 'SELECT * FROM t LIMIT 5000'],
];

/* ---------------------------------------------------------------- one cell */

if (CELL) {
    const { kind, limit, threads, qi } = JSON.parse(CELL);
    const { DuckDBInstance } = await duckdb();
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${limit}'`);
    if (threads) await connection.run(`SET threads = ${threads}`);

    let failure = null; let peakTag = null; let total = 0; let temp = 0;
    try {
        if (kind === 'native') {
            await connection.run(`ATTACH '${DB}' AS nat (READ_ONLY)`);
            const tbl = (await (await connection.run(
                "SELECT table_name FROM duckdb_tables() WHERE database_name = 'nat' LIMIT 1"
            )).getRowsJson())[0][0];
            await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM nat."${tbl}"`);
        } else {
            await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${PQ}')`);
        }
        await (await connection.run(QUERIES[qi][1])).getRowsJson();
    } catch (err) {
        failure = String(err.message || err).split('\n')[0];
    }
    try {
        const rows = await (await connection.run(
            `SELECT tag, memory_usage_bytes::BIGINT, temporary_storage_bytes::BIGINT
             FROM duckdb_memory() ORDER BY memory_usage_bytes DESC`
        )).getRowsJson();
        const nz = rows.map((r) => ({ tag: String(r[0]), b: Number(r[1]), t: Number(r[2]) }))
            .filter((r) => r.b > 0 || r.t > 0);
        total = nz.reduce((a, r) => a + r.b, 0);
        temp = nz.reduce((a, r) => a + r.t, 0);
        peakTag = nz[0] ? `${nz[0].tag}=${mb(nz[0].b)}` : null;
    } catch { /* the instance may be unusable after an OOM */ }

    console.log(JSON.stringify({
        kind, limit, threads, q: QUERIES[qi][0], failure, total, temp, peakTag,
        peakRss: process.resourceUsage().maxRSS * 1024,
    }));
    connection.disconnectSync();
    instance.closeSync();
    process.exit(0);
}

/* ---------------------------------------------------------------- driver */

heading(`PARQUET MEMORY LIMITS — ${ROWS.toLocaleString()} rows`);
await mkdir(ROOT, { recursive: true });
if (!existsSync(DB) || !existsSync(PQ)) {
    const { DuckFrame, closeDuckDatabase } = await duckFrame();
    const { CONFIG, makeRecords } = await import(
        new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
    );
    for (const p of [DB, `${DB}.wal`, PQ]) if (existsSync(p)) await rm(p, { force: true });
    const frame = await DuckFrame.create(CONFIG, { name: 'corpus', database: DB });
    let built = 0;
    while (built < ROWS) {
        const take = Math.min(100_000, ROWS - built);
        await frame.append({ records: makeRecords(take, built + 1) });
        built += take;
    }
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    await frame.query('CHECKPOINT');
    await frame.query(`COPY "${frame.table}" TO '${PQ}' (FORMAT parquet, COMPRESSION zstd)`);
    await closeDuckDatabase(DB);
    note('corpus built');
}
const dbBytes = (await stat(DB)).size;
const pqBytes = (await stat(PQ)).size;
note(`native ${mb(dbBytes)} · parquet ${mb(pqBytes)}`);
note('temp_directory defaults to ".tmp" with 90% of disk, so spilling IS available in every cell');

const self = fileURLToPath(import.meta.url);
const cell = async (spec) => {
    const { stdout } = await run(process.execPath, [self], {
        env: { ...process.env, CELL: JSON.stringify(spec), ROOT }, maxBuffer: 1 << 24,
    });
    return JSON.parse(stdout.trim().split('\n').at(-1));
};

/* ---- stage 1: every query, every limit, both kinds ---- */

const LIMITS = (process.env.LIMITS || '2GiB,1GiB,512MiB,256MiB,128MiB').split(',');
const stage1 = [];

heading('STAGE 1 — which query fails, at which limit');
note(`  ${'query'.padEnd(22)}${'kind'.padEnd(10)}${LIMITS.map((l) => l.padStart(10)).join('')}`);
for (const [qi, [qname]] of QUERIES.entries()) {
    for (const kind of ['parquet', 'native']) {
        const marks = [];
        for (const limit of LIMITS) {
            const r = await cell({ kind, limit, qi });
            stage1.push(r);
            marks.push((r.failure ? 'OOM' : 'ok').padStart(10));
        }
        note(`  ${(kind === 'parquet' ? qname : '').padEnd(22)}${kind.padEnd(10)}${marks.join('')}`);
    }
}

/* ---- stage 2: does thread count move the failure point? ---- */

const fragile = [...new Set(stage1.filter((r) => r.kind === 'parquet' && r.failure).map((r) => r.q))];
const stage2 = [];
if (fragile.length) {
    heading('STAGE 2 — do THREADS move it? (parquet decompression buffers are per-thread)');
    const THREADS = [14, 8, 4, 2, 1];
    const limit = process.env.THREAD_LIMIT || '256MiB';
    note(`  at memory_limit=${limit}`);
    note(`  ${'query'.padEnd(22)}${THREADS.map((t) => `t=${t}`.padStart(9)).join('')}`);
    for (const qname of fragile) {
        const qi = QUERIES.findIndex(([n]) => n === qname);
        const marks = [];
        for (const threads of THREADS) {
            const r = await cell({ kind: 'parquet', limit, threads, qi });
            stage2.push(r);
            marks.push((r.failure ? 'OOM' : 'ok').padStart(9));
        }
        note(`  ${qname.padEnd(22)}${marks.join('')}`);
    }
}

/* ---- stage 3: what holds the budget ---- */

heading('STAGE 3 — where the memory goes, per kind (largest tag, at the tightest limit that works)');
for (const kind of ['parquet', 'native']) {
    const ok = stage1.filter((r) => r.kind === kind && !r.failure && r.peakTag);
    const byQ = new Map();
    for (const r of ok) if (!byQ.has(r.q)) byQ.set(r.q, r);
    note(`  ${kind}`);
    for (const [q, r] of byQ) {
        note(`      ${q.padEnd(22)}${r.limit.padStart(9)}  ${(r.peakTag ?? '').padEnd(34)}`
            + `total ${mb(r.total).padStart(9)}${r.temp ? `  spilled ${mb(r.temp)}` : ''}`);
    }
}

await writeFile(OUT, JSON.stringify({
    rows: ROWS, nativeBytes: dbBytes, parquetBytes: pqBytes, limits: LIMITS, stage1, stage2,
}, null, 2));
note(`\n  results -> ${OUT}`);
process.exit(0);
