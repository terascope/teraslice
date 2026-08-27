/**
 * POINT 4 — MANY FILES vs ONE BIG FILE. File count, file size, jagged sizes, and how the big
 * file would actually be produced.
 *
 * Written for the boss-facing report (2026-08-25).
 *
 * **The trap this run is built to avoid.** Every earlier sweep varied file count at a fixed total,
 * so "more files" and "more row groups" moved together in every cell - and the write-up named FILES
 * as the cause, with a clean constant to back it. The real unit is the **ROW GROUP**. This run
 * therefore **censuses row groups with `parquet_file_metadata` rather than inferring them**, and
 * reports microseconds per ROW GROUP alongside per file, so the two axes can be told apart at a
 * glance rather than argued about.
 *
 * **Layouts**, all produced the way a worker really would - each file written independently, as a
 * slice lands - rather than by re-partitioning one big table:
 *
 *   uniform   10 / 100 / 1,000 / 5,000 files at a fixed total
 *   jagged    a realistic ragged mix, 10k-100k rows per slice
 *   merged    the jagged set consolidated into ONE object
 *
 * **"I'm not fully sure how that file would be generated"** - so both routes are measured:
 *
 *   1. `COPY (SELECT * FROM read_parquet([...])) TO one.parquet` - stream straight through
 *   2. `CREATE TABLE AS ...` then `COPY` it out      - stage in a table first
 *
 * plus the native table itself, because a table turned out to be CHEAPER to build than rewriting
 * Parquet and 2-20x faster to query - which is the result that decides whether consolidating into
 * Parquet is ever the right move.
 *
 * Run (serially - never two DuckDB benches at once):
 *   node packages/data-mate/docs/tools/bench/report-layout.mjs
 *   ROWS=10000000 node .../report-layout.mjs
 */
import { rm, mkdir, stat, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS || 10_000_000);
const UNIFORM = (process.env.UNIFORM || '10,100,1000,5000').split(',').map(Number);
const REPEATS = Number(process.env.REPEATS || 3);
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '24GiB';
const ROOT = process.env.ROOT || '/tmp/duck-layout';
const OUT = process.env.OUT || new URL('../results/layout.json', import.meta.url).pathname;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const QUERIES = [
    ['count(*) [metadata only]', 'SELECT count(*) FROM t'],
    ['search: 2 predicates', `SELECT count(*) FROM t WHERE "active" = true AND "category" = 'gamma'`],
    ['search: range + eq', `SELECT count(*) FROM t WHERE "amount" BETWEEN 100 AND 5000 AND "status" = 'active'`],
    ['search: text prefix', `SELECT count(*) FROM t WHERE "email" LIKE 'user1%'`],
    ['search: IN list', `SELECT count(*) FROM t WHERE "category" IN ('alpha','gamma')`],
    ['search: top 100 rows', 'SELECT * FROM t WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],
    ['agg: 1 key + 3 aggs', 'SELECT "category", count(*), sum("amount"), avg("score") FROM t GROUP BY 1'],
    ['agg: 2 keys + 3 aggs',
        'SELECT "category", "status", count(*), sum("amount"), max("score") FROM t GROUP BY 1, 2'],
    ['agg: high-card group', 'SELECT "name", count(*) FROM t GROUP BY 1'],
    ['agg: filtered + ordered',
        `SELECT "category", sum("amount") AS total FROM t WHERE "active" = true`
        + ' GROUP BY 1 ORDER BY total DESC LIMIT 20'],
    ['agg: count distinct', 'SELECT count(DISTINCT "name") FROM t'],
    ['agg: approx distinct', 'SELECT approx_count_distinct("name") FROM t'],
    ['agg: quantiles', `SELECT quantile_cont("amount", [0.5, 0.9, 0.99]) FROM t`],
    ['project 1 col', 'SELECT sum("amount") FROM t'],
    ['project all cols', 'SELECT * FROM t LIMIT 5000'],
];

/** Cheap, metadata-bound queries: the ones the row-group tax actually shows up in. */
const CHEAP = new Set([
    'count(*) [metadata only]', 'search: 2 predicates', 'search: range + eq',
    'search: IN list', 'project 1 col',
]);

async function timeQueries(connection, repeats) {
    const out = {};
    for (const [name, sql] of QUERIES) {
        const samples = [];
        for (let i = 0; i < repeats; i++) {
            const start = performance.now();
            await (await connection.run(sql)).getRowsJson();
            samples.push(performance.now() - start);
        }
        const rest = samples.slice(1);
        out[name] = { cold: samples[0], warm: rest.length ? median(rest) : samples[0] };
    }
    return out;
}

async function dirBytes(dir) {
    let total = 0;
    for (const f of await readdir(dir)) {
        try { total += (await stat(join(dir, f))).size; } catch { /* gone */ }
    }
    return total;
}

/**
 * Produce one layout the way the worker receives it: each slice written as its own object.
 *
 * `sizeFor(n)` returns the row count of slice n, so a ragged mix is expressed the same way a
 * uniform one is.
 */
async function produce(dir, rows, sizeFor) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const db = `${dir}.gen.db`;
    for (const p of [db, `${db}.wal`]) if (existsSync(p)) await rm(p, { force: true });

    let made = 0; let n = 0;
    const start = performance.now();
    while (made < rows) {
        const take = Math.min(sizeFor(n), rows - made);
        const frame = await DuckFrame.create(CONFIG, { name: `p${n}`, database: db });
        await frame.append({ records: makeRecords(take, made + 1) });
        await frame.writeParquet(join(dir, `part-${String(n).padStart(5, '0')}.parquet`));
        await frame.destroy();
        made += take; n += 1;
    }
    const ms = performance.now() - start;
    await closeDuckDatabase(db);
    for (const p of [db, `${db}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    return { files: n, produceMs: ms, bytes: await dirBytes(dir) };
}

/** CENSUS the row groups. Never infer them from the requested size - DuckDB rounds. */
async function census(connection, glob) {
    const rows = await (await connection.run(
        `SELECT count(DISTINCT file_name), sum(num_row_groups) FROM parquet_file_metadata('${glob}')`
    )).getRowsJson();
    return { files: Number(rows[0][0]), rowGroups: Number(rows[0][1]) };
}

async function battery(setup) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const start = performance.now();
    const meta = await setup(connection);
    const setupMs = performance.now() - start;
    const queries = await timeQueries(connection, REPEATS);
    connection.disconnectSync();
    instance.closeSync();
    return { setupMs, queries, meta };
}

const totalOf = (queries, subset) => QUERIES
    .filter(([n]) => (subset ? subset.has(n) : true))
    .reduce((a, [n]) => a + queries[n].warm, 0);

/* ------------------------------------------------------------------ run */

heading(`POINT 4 — FILE LAYOUT at ${num(ROWS)} rows`);
note(`memory_limit=${MEMORY_LIMIT}; row groups are CENSUSED, never inferred`);

await mkdir(ROOT, { recursive: true });
const layouts = [];

/* ---- uniform file counts, and the jagged mix ---- */

const specs = UNIFORM.map((files) => ({
    label: `${num(files)} files`,
    dir: join(ROOT, `u${files}`),
    sizeFor: () => Math.ceil(ROWS / files),
}));

/**
 * The realistic ragged mix. Deterministic - a benchmark that reshuffles per run cannot be
 * compared with itself. 10k-100k is what `qpl-search-api` really returns, and 100k is its cap.
 */
specs.push({
    label: 'jagged 10k-100k',
    dir: join(ROOT, 'jagged'),
    sizeFor: (n) => 10_000 + ((n * 37_889) % 91_000),
});

for (const spec of specs) {
    const made = await produce(spec.dir, ROWS, spec.sizeFor);
    const glob = join(spec.dir, '*.parquet');
    const r = await battery(async (c) => census(c, glob).then(async (m) => {
        await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${glob}')`);
        return m;
    }));
    layouts.push({ ...spec, dir: spec.dir, ...made, ...r.meta, queries: r.queries, kind: 'parquet' });
    note(`  ${spec.label.padEnd(18)} ${String(r.meta.files).padStart(5)} files`
        + ` ${String(r.meta.rowGroups).padStart(6)} groups  ${mb(made.bytes).padStart(10)}`
        + `  produced in ${(made.produceMs / 1000).toFixed(1)}s`);
}

/* ---- consolidation: the two routes, from the JAGGED set ---- */

const jagged = layouts.find((l) => l.label === 'jagged 10k-100k');
const jaggedGlob = join(jagged.dir, '*.parquet');

heading('CONSOLIDATION — the two routes to one big object, plus a native table');

const oneStream = join(ROOT, 'merged-stream.parquet');
const oneStaged = join(ROOT, 'merged-staged.parquet');
const nativeDb = join(ROOT, 'merged.db');
for (const p of [oneStream, oneStaged, nativeDb, `${nativeDb}.wal`]) {
    if (existsSync(p)) await rm(p, { force: true });
}

async function buildCost(fn) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const start = performance.now();
    await fn(connection);
    const ms = performance.now() - start;
    connection.disconnectSync();
    instance.closeSync();
    return ms;
}

const streamMs = await buildCost((c) => c.run(
    `COPY (SELECT * FROM read_parquet('${jaggedGlob}')) TO '${oneStream}' (FORMAT parquet, COMPRESSION zstd)`
));
const stagedMs = await buildCost(async (c) => {
    await c.run(`CREATE TABLE staged AS SELECT * FROM read_parquet('${jaggedGlob}')`);
    await c.run(`COPY staged TO '${oneStaged}' (FORMAT parquet, COMPRESSION zstd)`);
});
const nativeMs = await buildCost(async (c) => {
    await c.run(`ATTACH '${nativeDb}' AS mat`);
    await c.run(`CREATE TABLE mat.t AS SELECT * FROM read_parquet('${jaggedGlob}')`);
    await c.run('CHECKPOINT mat');
});

note(`  route 1  COPY straight through        ${(streamMs / 1000).toFixed(2)}s  ${mb((await stat(oneStream)).size)}`);
note(`  route 2  CREATE TABLE AS, then COPY   ${(stagedMs / 1000).toFixed(2)}s  ${mb((await stat(oneStaged)).size)}`);
note(`  native   CREATE TABLE AS (no rewrite) ${(nativeMs / 1000).toFixed(2)}s`);

for (const [label, path, ms] of [
    ['merged (1 file)', oneStream, streamMs],
    ['merged (staged)', oneStaged, stagedMs],
]) {
    const r = await battery(async (c) => census(c, path).then(async (m) => {
        await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${path}')`);
        return m;
    }));
    layouts.push({
        label, dir: path, files: 1, produceMs: ms, bytes: (await stat(path)).size,
        ...r.meta, queries: r.queries, kind: 'merged',
    });
}

const nativeBattery = await battery(async (c) => {
    await c.run(`ATTACH '${nativeDb}' AS mat (READ_ONLY)`);
    await c.run('CREATE OR REPLACE VIEW t AS SELECT * FROM mat.t');
    return { files: 1, rowGroups: Math.ceil(ROWS / 122880) };
});
layouts.push({
    label: 'native table', dir: nativeDb, files: 1, produceMs: nativeMs,
    bytes: (await stat(nativeDb)).size, ...nativeBattery.meta,
    queries: nativeBattery.queries, kind: 'native',
});

/* ---- the law, and the battery ---- */

heading('THE ROW-GROUP LAW — is the unit the FILE or the ROW GROUP?');
note(`  ${'layout'.padEnd(20)}${'files'.padStart(7)}${'groups'.padStart(8)}`
    + `${'count(*)'.padStart(11)}${'us/file'.padStart(10)}${'us/group'.padStart(11)}`);
for (const l of layouts) {
    const ms = l.queries['count(*) [metadata only]'].warm;
    note(`  ${l.label.padEnd(20)}${String(l.files).padStart(7)}${String(l.rowGroups).padStart(8)}`
        + `${`${ms.toFixed(1)} ms`.padStart(11)}`
        + `${((ms * 1000) / l.files).toFixed(0).padStart(10)}`
        + `${((ms * 1000) / l.rowGroups).toFixed(0).padStart(11)}`);
}

heading('QUERY BATTERY — warm ms');
console.log(`    ${'layout'.padEnd(20)}` + QUERIES.map(([n]) => n.slice(0, 11).padStart(12)).join(''));
for (const l of layouts) {
    console.log(`    ${l.label.padEnd(20)}`
        + QUERIES.map(([n]) => l.queries[n].warm.toFixed(1).padStart(12)).join(''));
}

heading('TOTALS — and the cheap-query subset, where the tax actually lands');
note(`  ${'layout'.padEnd(20)}${'full battery'.padStart(14)}${'cheap only'.padStart(13)}${'build'.padStart(10)}${'size'.padStart(12)}`);
for (const l of layouts) {
    note(`  ${l.label.padEnd(20)}${`${totalOf(l.queries).toFixed(0)} ms`.padStart(14)}`
        + `${`${totalOf(l.queries, CHEAP).toFixed(0)} ms`.padStart(13)}`
        + `${`${(l.produceMs / 1000).toFixed(1)}s`.padStart(10)}${mb(l.bytes).padStart(12)}`);
}
note('  build for the uniform/jagged rows is the PRODUCER leg (every design pays it);');
note('  for merged/native it is the extra rewrite the worker would pay on top.');

await writeFile(OUT, JSON.stringify({
    rows: ROWS,
    queries: QUERIES.map(([n]) => n),
    layouts: layouts.map(({ label, kind, files, rowGroups, produceMs, bytes, queries }) => ({
        label, kind, files, rowGroups, produceMs, bytes, queries,
    })),
}, null, 2));
note(`  results -> ${OUT}`);

await rm(ROOT, { recursive: true, force: true });
process.exit(0);
