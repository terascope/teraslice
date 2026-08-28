/**
 * Querying Parquet payloads DIRECTLY, versus loading them into a table first.
 *
 * **The question this exists to answer.** The worker's fetches land as Parquet payloads and today
 * they are appended into one table, which costs 10-45 ms per append and is the dominant cost of a
 * long-running job. A `VIEW` over `read_parquet([...])` costs ~1 ms to create - ingest becomes free
 * - and at 2M rows over 40 files it queried within a few ms of a real table. That is one encouraging
 * data point in a regime that does not matter. The regime that matters is **thousands of files**,
 * where per-file open and metadata parsing, the absence of cross-file zone maps, and repeated
 * Parquet decode all scale against the view.
 *
 * So the axis here is **FILE COUNT AT FIXED TOTAL ROWS** - more fetches means more, smaller payloads
 * - crossed with total rows and with the storage the comparison table lives in.
 *
 * What is deliberately measured, because each is a way the view could lose:
 *
 *   - **per-file overhead**, isolated by holding rows constant and varying file count
 *   - **filter pushdown / row-group pruning**, via a selective filter against a broad one
 *   - **projection pushdown**, via one column against all thirty
 *   - **cold versus warm**, because the first query pays metadata parsing the rest do not
 *   - **the payback point**: how many queries before `CREATE TABLE AS` is cheaper than the view
 *   - **RSS**, because a scan over thousands of files is where it would show
 *
 * **Why this is not in `bench/comparison`.** That harness calls `makeRecords(scale)` and holds every
 * record as a JS object before any case runs, so it cannot reach 25M, let alone 100M. Generation
 * here is chunked, the way `scale-ingest.mjs` does it.
 *
 * **Corpus is generated ONCE per scale at the finest granularity and MERGED upward** with
 * `COPY (SELECT * FROM read_parquet([...])) TO`, so a 100M corpus is produced once rather than once
 * per file count. The merge is DuckDB-side and fast; producing 100M rows through the JavaScript
 * producer is ~11 minutes on its own.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/parquet-query.mjs
 *   SCALES=50000,100000,500000,1000000 node .../parquet-query.mjs      # the quick tier
 *   SCALES=25000000,100000000 FILES=100,1000,5000 node .../parquet-query.mjs   # the heavy tier
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const SCALES = (process.env.SCALES
    || '50000,100000,500000,1000000,5000000,25000000,100000000')
    .split(',').map(Number);
const FILES = (process.env.FILES || '10,100,1000,5000').split(',').map(Number);
/**
 * **File count and ROWS PER FILE are the same axis read two ways**, and rows-per-file is the one to
 * design against: at a fixed total, 5,000 files of a 25M corpus is 5,000 rows each, and 100 files is
 * 250,000 each. Every table below prints both.
 *
 * The hypothesis this exists to test: **DuckDB's default Parquet row group is 122,880 rows**, so a
 * payload smaller than that produces one under-filled row group whose metadata is read in full for
 * any query. If the knee in the per-file tax sits at the row-group boundary rather than at some
 * arbitrary file count, then the design rule is "make payloads at least one row group" rather than
 * "make fewer files". `ROW_GROUP_SIZE` re-writes the corpus with an explicit size so the two can be
 * separated.
*/
const ROW_GROUP_SIZE = Number(process.env.ROW_GROUP_SIZE || 0);
/** A file below this many rows is not a realistic payload and only measures open cost. */
const MIN_ROWS_PER_FILE = Number(process.env.MIN_ROWS_PER_FILE || 200);
const GEN_CHUNK = Number(process.env.GEN_CHUNK || 100_000);
const REPEATS = Number(process.env.REPEATS || 3);
const STORAGES = (process.env.STORAGE || 'memory,file').split(',');
const SPOOL = process.env.SPOOL || '/tmp/duck-pq-spool';
const DB = process.env.DB || '/tmp/duck-pq.db';

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const ms1 = (n) => `${n.toFixed(1)} ms`;
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(0)} MB`;
const rss = () => process.memoryUsage().rss;

/* ------------------------------------------------------------------ corpus */

const sqlList = (paths) => `[${paths.map((p) => `'${p}'`).join(',')}]`;

/**
 * Writes `scale` rows as `finest` Parquet files through the real producer path, in chunks so the
 * JavaScript side never holds more than `GEN_CHUNK` records at once.
 */
async function generate(scale, finest, dir) {
    await mkdir(dir, { recursive: true });
    const perFile = Math.ceil(scale / finest);
    const paths = [];
    let written = 0;
    let seed = 1;

    const start = performance.now();
    while (written < scale) {
        const take = Math.min(perFile, scale - written);
        // one payload may exceed the JS chunk budget, so build it in pieces and concatenate
        const pieces = [];
        for (let done = 0; done < take; done += GEN_CHUNK) {
            pieces.push(...makeRecords(Math.min(GEN_CHUNK, take - done), seed++));
        }
        const frame = await DuckFrame.fromRecords(CONFIG, pieces, { name: `gen_${paths.length}` });
        const path = join(dir, `p${String(paths.length).padStart(5, '0')}.parquet`);
        await frame.writeParquet(path);
        await frame.destroy();
        paths.push(path);
        written += take;
    }
    note(`  generated ${num(scale)} rows into ${paths.length} files`
        + ` in ${((performance.now() - start) / 1000).toFixed(1)}s`);
    return paths;
}

/**
 * Merges `paths` down to `count` files with a DuckDB-side COPY - far cheaper than regenerating.
 * Returns the new paths.
 */
async function repartition(connection, paths, count, dir) {
    await mkdir(dir, { recursive: true });
    const groupSize = Math.ceil(paths.length / count);
    const out = [];
    for (let i = 0; i < paths.length; i += groupSize) {
        const group = paths.slice(i, i + groupSize);
        const path = join(dir, `m${String(out.length).padStart(5, '0')}.parquet`);
        const opts = ROW_GROUP_SIZE
            ? `(FORMAT PARQUET, ROW_GROUP_SIZE ${ROW_GROUP_SIZE})`
            : '(FORMAT PARQUET)';
        await connection.run(
            `COPY (SELECT * FROM read_parquet(${sqlList(group)})) TO '${path}' ${opts}`
        );
        out.push(path);
    }
    return out;
}

/* ------------------------------------------------------------------ query battery */

/**
 * Every shape that could separate a view from a table, and the reason each is here.
 *
 * `selective` and `broad` differ only in how much they match, which is what isolates row-group
 * pruning; `one column` against `all columns` is what isolates projection pushdown.
*/
const QUERIES = [
    /**
     * **`count(*)` is here as an INSTRUMENT, not a workload.** It touches no column data, so it
     * isolates Parquet metadata cost - which is exactly the per-file tax - and nothing else. Never
     * quote it as a query benchmark; it is the thermometer.
    */
    ['count(*) [metadata only]', 'SELECT count(*) FROM t'],
    // NOTE: `METADATA_QUERY` below reads this label back. Do not repeat it as a literal - the
    // summary section did, the label later gained its suffix, and the whole section crashed with
    // `Cannot read properties of undefined` AFTER a four-minute battery had already been measured.


    // --- searches: what a spaces request actually issues
    // `category` is alpha/beta/gamma/delta/epsilon - NOT `cat-N`. Until 2026-08-24 this read
    // `'cat-3'` and matched ZERO rows, so it timed a scan whose filter never passed anything.
    ['search: 2 predicates', `SELECT count(*) FROM t WHERE "active" = true AND "category" = 'gamma'`],
    ['search: range + eq', `SELECT count(*) FROM t WHERE "amount" BETWEEN 100 AND 5000 AND "status" = 'active'`],
    ['search: text prefix', `SELECT count(*) FROM t WHERE "email" LIKE 'user1%'`],
    ['search: IN list', `SELECT count(*) FROM t WHERE "category" IN ('alpha','gamma')`],
    ['search: top 100 rows', 'SELECT * FROM t WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],

    // --- aggregations: the shapes a dashboard and a report ask for
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

    // --- projection, which is what isolates column pushdown
    ['project 1 col', 'SELECT sum("amount") FROM t'],
    ['project all cols', 'SELECT * FROM t LIMIT 5000'],
];

async function timeQueries(connection) {
    const out = {};
    for (const [name, sql] of QUERIES) {
        const samples = [];
        for (let i = 0; i < REPEATS; i++) {
            const start = performance.now();
            await (await connection.run(sql)).getRowsJson();
            samples.push(performance.now() - start);
        }
        // the FIRST sample is the cold one - metadata parsing is paid once
        out[name] = { cold: samples[0], warm: median(samples.slice(1).length ? samples.slice(1) : samples) };
    }
    return out;
}

function median(xs) {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
}

/* ------------------------------------------------------------------ one cell */

async function openStorage(kind) {
    if (kind === 'file') {
        for (const suffix of ['', '.wal']) {
            if (existsSync(DB + suffix)) await rm(DB + suffix, { force: true });
        }
    }
    const instance = await DuckDBInstance.create(kind === 'file' ? DB : ':memory:');
    const connection = await instance.connect();
    await connection.run(`SET checkpoint_threshold = '1TB'`);
    return { instance, connection };
}

const rows = [];

async function measure(scale, kind, shape, fileCount, paths) {
    const { instance, connection } = await openStorage(kind);
    const before = rss();

    const buildStart = performance.now();
    if (shape === 'view') {
        await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet(${sqlList(paths)})`);
    } else {
        await connection.run(`CREATE OR REPLACE TABLE t AS SELECT * FROM read_parquet(${sqlList(paths)})`);
    }
    const buildMs = performance.now() - buildStart;

    const queries = await timeQueries(connection);
    const peak = rss();

    let bytes = 0;
    if (kind === 'file' && shape === 'table') {
        await connection.run('CHECKPOINT');
        bytes = (await stat(DB)).size;
    }

    connection.disconnectSync();
    instance.closeSync();

    const row = {
        scale, storage: kind, shape, files: fileCount, buildMs, queries, bytes, rssDelta: peak - before,
    };
    rows.push(row);
    return row;
}

/**
 * The metadata-only query's label, read back from the battery rather than repeated.
 *
 * `count(*)` touches no column data, so it is the instrument that isolates Parquet metadata cost -
 * which is the per-file (or per-row-group) tax and nothing else.
 */
const METADATA_QUERY = QUERIES[0][0];

/* ------------------------------------------------------------------ run */

if (existsSync(SPOOL)) await rm(SPOOL, { recursive: true, force: true });

for (const scale of SCALES) {
    const counts = FILES.filter((f) => scale / f >= MIN_ROWS_PER_FILE);
    if (!counts.length) {
        note(`skipping ${num(scale)}: every requested file count is under`
            + ` ${MIN_ROWS_PER_FILE} rows per file`);
        continue;
    }
    heading(`${num(scale)} rows — file counts ${counts.join(', ')}`);

    const finest = Math.max(...counts);
    const base = join(SPOOL, `s${scale}`);
    const finestPaths = await generate(scale, finest, join(base, `f${finest}`));

    // one connection just for the merges, so repartition cost is never inside a measurement
    const { instance: mergeInst, connection: merge } = await openStorage('memory');
    const merge2 = async (sql) => {
        const reader = await merge.runAndReadAll(sql);
        return reader.getRows();
    };
    const byCount = { [finest]: finestPaths };
    for (const count of counts.filter((c) => c !== finest)) {
        const start = performance.now();
        byCount[count] = await repartition(merge, finestPaths, count, join(base, `f${count}`));
        note(`  repartitioned to ${count} files in ${((performance.now() - start) / 1000).toFixed(1)}s`);
    }

    /**
     * **Count the row groups, do not infer them.** The whole point of `ROW_GROUP_SIZE` is to
     * separate "how many files" from "how many row groups", and those two are only separable if
     * the second is MEASURED. `ROW_GROUP_SIZE` is honoured by `repartition` alone, so the finest
     * tier keeps whatever `writeParquet` chose and that difference has to be visible.
     */
    for (const count of counts) {
        const [[groups, files]] = await merge2(
            `SELECT sum(num_row_groups), count(*) FROM parquet_file_metadata(${sqlList(byCount[count])})`
        );
        note(`  ${String(count).padStart(5)} files x ${num(scale / count).padStart(9)} rows`
            + ` = ${num(Number(groups)).padStart(7)} row groups`
            + ` (${(Number(groups) / Number(files)).toFixed(1)} per file,`
            + ` ${num(scale / Number(groups))} rows each)`);
    }
    merge.disconnectSync();
    mergeInst.closeSync();

    for (const kind of STORAGES) {
        console.log(`\n  ${kind} — build, then each query as cold / warm (ms)`);
        const header = QUERIES.map(([n]) => n.slice(0, 17).padStart(18)).join('');
        console.log(`    ${'shape'.padEnd(22)}${'build'.padStart(9)}${header}`);
        for (const count of counts) {
            const r = await measure(scale, kind, 'view', count, byCount[count]);
            const rpf = Math.round(scale / count);
            console.log(`    ${`view ${count}f x ${num(rpf)}`.padEnd(22)}${r.buildMs.toFixed(0).padStart(9)}`
                + QUERIES.map(([n]) => `${r.queries[n].cold.toFixed(0)}/${r.queries[n].warm.toFixed(0)}`.padStart(18)).join(''));
        }
        const t = await measure(scale, kind, 'table', finest, byCount[finest]);
        console.log(`    ${`TABLE (from ${finest} files)`.padEnd(22)}${t.buildMs.toFixed(0).padStart(9)}`
            + QUERIES.map(([n]) => `${t.queries[n].cold.toFixed(0)}/${t.queries[n].warm.toFixed(0)}`.padStart(18)).join(''));
        if (t.bytes) note(`    table on disk: ${mb(t.bytes)}`);
    }

    /* ---- the payback point: build cost against per-query cost ---- */
    for (const kind of STORAGES) {
        const table = rows.find((r) => r.scale === scale && r.storage === kind && r.shape === 'table');
        const view = rows.filter((r) => r.scale === scale && r.storage === kind && r.shape === 'view')
            .sort((a, b) => b.files - a.files)[0];
        if (!table || !view) continue;
        const perQuery = QUERIES.reduce(
            (sum, [n]) => sum + (view.queries[n].warm - table.queries[n].warm), 0
        ) / QUERIES.length;
        const verdict = perQuery <= 0
            ? 'the view is not slower per query - it never pays back'
            : `${Math.ceil((table.buildMs - view.buildMs) / perQuery)} queries to pay back the table build`;
        note(`  [${kind}] view over ${view.files} files costs ${ms1(perQuery)} more per query on`
            + ` average; table build is ${ms1(table.buildMs)} -> ${verdict}`);
    }

    await rm(base, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ summary */

heading('PER-FILE OVERHEAD — the number that decides the feature');
note('rows held constant, so any growth across a row is the cost of having more files');
for (const kind of STORAGES) {
    for (const scale of [...new Set(rows.map((r) => r.scale))]) {
        const views = rows.filter(
            (r) => r.scale === scale && r.storage === kind && r.shape === 'view'
        ).sort((a, b) => a.files - b.files);
        if (views.length < 2) continue;
        const cells = views.map(
            (v) => `${v.files}f ${v.queries[METADATA_QUERY]?.warm.toFixed(1) ?? '?'}`
        ).join('   ');
        const table = rows.find((r) => r.scale === scale && r.storage === kind && r.shape === 'table');
        note(`  ${kind.padEnd(7)} ${num(scale).padStart(12)} rows  count(*) warm:  ${cells}`
            + (table ? `   TABLE ${table.queries[METADATA_QUERY]?.warm.toFixed(1) ?? '?'}` : ''));
    }
}

await rm(SPOOL, { recursive: true, force: true });
for (const suffix of ['', '.wal']) {
    if (existsSync(DB + suffix)) await rm(DB + suffix, { force: true });
}
await closeDuckDatabase();
process.exit(0);
