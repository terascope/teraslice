/**
 * MANY FILES vs ONE BIG FILE — the intermediate points, with every row group CENSUSED.
 *
 * Replaces the layout half of `report-layout.mjs` for the report (2026-08-25), because that run had
 * two real defects:
 *
 *   1. It reported "microseconds per FILE" for single-file layouts, where the figure is degenerate -
 *      it is just the whole query time - which made the column look wrong because it WAS wrong.
 *   2. It INFERRED the native table's row-group count as ceil(rows / 122,880) instead of censusing
 *      it. Inferring the unit is precisely the mistake that produced the per-file law in the first
 *      place, so it should never have been done here.
 *
 * It also only had two consolidation points - "as landed" and "all in one" - which cannot show WHERE
 * between them the benefit arrives. That is the actual question: at what object size does
 * consolidating stop paying?
 *
 * **The census, per storage kind:**
 *   parquet - `parquet_file_metadata`, summing `num_row_groups`
 *   native  - `count(DISTINCT row_group_id)` from `pragma_storage_info`, which is a real count of
 *             what DuckDB built, not a division
 *
 * **Row-group FILL is the explanatory variable**, so it is reported directly rather than left to be
 * derived: a layout's cost follows how many row groups it holds, and its group count follows how
 * full each one is. DuckDB's default group is 122,880 rows and no slice the producer can emit
 * (<=100k) can fill one.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/report-consolidation.mjs
 */
import { rm, mkdir, stat, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS || 10_000_000);
const REPEATS = Number(process.env.REPEATS || 3);
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '24GiB';
const ROOT = process.env.ROOT || '/tmp/duck-consol';
const OUT = process.env.OUT || new URL('../results/consolidation.json', import.meta.url).pathname;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
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

/** Produce a layout the way the worker receives it: one object per slice. */
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

/** CENSUS - parquet. Never inferred. */
async function censusParquet(connection, glob) {
    const r = await (await connection.run(
        `SELECT count(DISTINCT file_name)::BIGINT, sum(num_row_groups)::BIGINT
         FROM parquet_file_metadata('${glob}')`
    )).getRowsJson();
    return { files: Number(r[0][0]), rowGroups: Number(r[0][1]) };
}

/** CENSUS - native. A real count of what DuckDB built, not rows / 122,880. */
async function censusNative(connection, table) {
    const r = await (await connection.run(
        `SELECT count(DISTINCT row_group_id)::BIGINT FROM pragma_storage_info('${table}')`
    )).getRowsJson();
    return { files: 1, rowGroups: Number(r[0][0]) };
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

const totalOf = (q, subset) => QUERIES.filter(([n]) => (subset ? subset.has(n) : true))
    .reduce((a, [n]) => a + q[n].warm, 0);

/* ------------------------------------------------------------------ run */

heading(`MANY FILES vs ONE BIG FILE — ${num(ROWS)} rows, every row group censused`);
note(`memory_limit=${MEMORY_LIMIT}; DuckDB's default row group is 122,880 rows`);

await mkdir(ROOT, { recursive: true });
const results = [];

/* ---- as the worker receives them ---- */

const RAW = [
    ['as landed: 1,000 × 10k', join(ROOT, 'r10k'), () => 10_000],
    ['as landed: 200 × 50k', join(ROOT, 'r50k'), () => 50_000],
    ['as landed: 100 × 100k', join(ROOT, 'r100k'), () => 100_000],
    ['as landed: jagged 10k–100k', join(ROOT, 'rjag'), (n) => 10_000 + ((n * 37_889) % 91_000)],
];

for (const [label, dir, sizeFor] of RAW) {
    const made = await produce(dir, ROWS, sizeFor);
    const glob = join(dir, '*.parquet');
    const r = await battery(async (c) => {
        const m = await censusParquet(c, glob);
        await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${glob}')`);
        return m;
    });
    results.push({
        label, kind: 'as-landed', dir, ...made, ...r.meta,
        buildMs: 0, bytes: made.bytes, queries: r.queries,
    });
    note(`  ${label.padEnd(28)} ${String(r.meta.files).padStart(5)} files`
        + ` ${String(r.meta.rowGroups).padStart(6)} groups`
        + ` ${num(ROWS / r.meta.rowGroups).padStart(9)} rows/group`);
}

/* ---- consolidated, at several target sizes, all from the SAME jagged input ---- */

const jag = results.find((r) => r.kind === 'as-landed' && r.label.includes('jagged'));
const jagGlob = join(jag.dir, '*.parquet');

const TARGETS = [
    ['consolidated: ~123k rows/object', 122_880],
    ['consolidated: ~500k rows/object', 500_000],
    ['consolidated: ~2M rows/object', 2_000_000],
    ['consolidated: ONE object', ROWS],
];

for (const [label, target] of TARGETS) {
    const dir = join(ROOT, `c${target}`);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const batches = Math.ceil(ROWS / target);
    const start = performance.now();
    for (let i = 0; i < batches; i++) {
        await connection.run(
            `COPY (SELECT * FROM read_parquet('${jagGlob}') LIMIT ${target} OFFSET ${i * target})`
            + ` TO '${join(dir, `part-${i}.parquet`)}' (FORMAT parquet, COMPRESSION zstd)`
        );
    }
    const buildMs = performance.now() - start;
    connection.disconnectSync();
    instance.closeSync();

    const glob = join(dir, '*.parquet');
    const r = await battery(async (c) => {
        const m = await censusParquet(c, glob);
        await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${glob}')`);
        return m;
    });
    results.push({
        label, kind: 'consolidated', dir, ...r.meta, buildMs,
        bytes: await dirBytes(dir), queries: r.queries,
    });
    note(`  ${label.padEnd(28)} ${String(r.meta.files).padStart(5)} files`
        + ` ${String(r.meta.rowGroups).padStart(6)} groups`
        + ` ${num(ROWS / r.meta.rowGroups).padStart(9)} rows/group`
        + `  built in ${(buildMs / 1000).toFixed(2)}s`);
}

/* ---- the native table, censused properly ---- */

const nativeDb = join(ROOT, 'native.db');
for (const p of [nativeDb, `${nativeDb}.wal`]) if (existsSync(p)) await rm(p, { force: true });
{
    const instance = await DuckDBInstance.create(nativeDb);
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const start = performance.now();
    await connection.run(`CREATE TABLE t AS SELECT * FROM read_parquet('${jagGlob}')`);
    await connection.run('CHECKPOINT');
    const buildMs = performance.now() - start;
    connection.disconnectSync();
    instance.closeSync();

    const r = await battery(async (c) => {
        await c.run(`ATTACH '${nativeDb}' AS nat (READ_ONLY)`);
        const m = await censusNative(c, 'nat.t');
        await c.run('CREATE OR REPLACE VIEW t AS SELECT * FROM nat.t');
        return m;
    });
    results.push({
        label: 'native TABLE', kind: 'native', dir: nativeDb, ...r.meta, buildMs,
        bytes: (await stat(nativeDb)).size, queries: r.queries,
    });
    note(`  ${'native TABLE'.padEnd(28)} ${String(r.meta.files).padStart(5)} file `
        + ` ${String(r.meta.rowGroups).padStart(6)} groups`
        + ` ${num(ROWS / r.meta.rowGroups).padStart(9)} rows/group`
        + `  built in ${(buildMs / 1000).toFixed(2)}s`);
}

/* ---- the two routes to one object ---- */

heading('HOW THE SINGLE OBJECT IS GENERATED — two routes');
const oneStream = join(ROOT, 'one-stream.parquet');
const oneStaged = join(ROOT, 'one-staged.parquet');
for (const p of [oneStream, oneStaged]) if (existsSync(p)) await rm(p, { force: true });

async function timeRoute(fn) {
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
const streamMs = await timeRoute((c) => c.run(
    `COPY (SELECT * FROM read_parquet('${jagGlob}')) TO '${oneStream}' (FORMAT parquet, COMPRESSION zstd)`
));
const stagedMs = await timeRoute(async (c) => {
    await c.run(`CREATE TABLE s AS SELECT * FROM read_parquet('${jagGlob}')`);
    await c.run(`COPY s TO '${oneStaged}' (FORMAT parquet, COMPRESSION zstd)`);
});
note(`  stream through  COPY (SELECT … read_parquet) TO one.parquet   ${(streamMs / 1000).toFixed(2)}s  ${mb((await stat(oneStream)).size)}`);
note(`  stage first     CREATE TABLE AS …, then COPY it out            ${(stagedMs / 1000).toFixed(2)}s  ${mb((await stat(oneStaged)).size)}`);

/* ---- output ---- */

heading('THE TABLE — file count, censused row groups, fill, and cost');
note(`  ${'layout'.padEnd(32)}${'files'.padStart(7)}${'groups'.padStart(8)}${'rows/group'.padStart(12)}`
    + `${'count(*)'.padStart(10)}${'µs/group'.padStart(10)}${'cheap'.padStart(9)}${'full'.padStart(9)}${'build'.padStart(9)}`);
for (const r of results) {
    const ms = r.queries['count(*) [metadata only]'].warm;
    note(`  ${r.label.padEnd(32)}${num(r.files).padStart(7)}${num(r.rowGroups).padStart(8)}`
        + `${num(ROWS / r.rowGroups).padStart(12)}${`${ms.toFixed(1)}`.padStart(10)}`
        + `${((ms * 1000) / r.rowGroups).toFixed(0).padStart(10)}`
        + `${totalOf(r.queries, CHEAP).toFixed(0).padStart(9)}`
        + `${totalOf(r.queries).toFixed(0).padStart(9)}`
        + `${`${(r.buildMs / 1000).toFixed(1)}s`.padStart(9)}`);
}

await writeFile(OUT, JSON.stringify({
    rows: ROWS,
    queries: QUERIES.map(([n, sql]) => ({ name: n, sql })),
    cheap: [...CHEAP],
    routes: { streamMs, stagedMs },
    layouts: results.map(({ label, kind, files, rowGroups, buildMs, bytes, queries }) => ({
        label, kind, files, rowGroups, buildMs, bytes, queries,
    })),
}, null, 2));
note(`  results -> ${OUT}`);

await rm(ROOT, { recursive: true, force: true });
process.exit(0);
