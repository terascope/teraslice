/**
 * DuckDB's NATIVE storage against every file format it can read — size, write cost, query cost.
 *
 * **The question this exists to answer.** The whole "Parquet as the table" direction (see
 * `PERFORMANCE.md` §Querying Parquet directly) compares exactly two things: a materialised native
 * table, and a view over Parquet. Nobody has asked what the native format actually IS, how its size
 * compares, or whether one of the other formats DuckDB reads would beat Parquet at the worker. This
 * measures all of them on one corpus.
 *
 * **What the native format is** (v1.5.5, verified from the build, not from docs):
 *
 *   - a **single database file** in 256 KiB blocks (`default_block_size` = 262144)
 *   - written for backward compatibility with `storage_compatibility_version` = v0.10.2
 *   - columns stored in **row groups of 122,880 rows** — the SAME constant as DuckDB's default
 *     Parquet row group, which is why the row-group law transfers between the two
 *   - **per-segment compression chosen automatically** per column: Constant, RLE, BitPacking,
 *     Dictionary, FSST (strings), ALP (floats), or Uncompressed. This run prints the breakdown.
 *   - min/max **zone maps** per row group, an ART index where one is declared, plus MVCC and a WAL.
 *     None of that exists in Parquet.
 *
 * The structural difference that should drive the query numbers: **the native format is read by the
 * operators it was written for and its compression is designed to be scanned lazily, while Parquet
 * must have its metadata parsed and its pages decoded on every query** (no cross-file zone maps,
 * no reuse between queries unless a cache is on).
 *
 * **Formats covered**, all verified writable AND readable offline on this build:
 *
 *   | format | written with | read with |
 *   |---|---|---|
 *   | native | the table itself | direct, and `read_duckdb()` over the file |
 *   | Parquet zstd / snappy / uncompressed | `COPY … (FORMAT parquet, COMPRESSION …)` | `read_parquet` |
 *   | Arrow IPC | `COPY … (FORMAT arrow)` | `read_arrow` — needs `LOAD nanoarrow` |
 *   | CSV | `COPY … (FORMAT csv)` | `read_csv` |
 *   | NDJSON | `COPY … (FORMAT json)` | `read_ndjson` |
 *
 * `iceberg`, `delta`, `avro` and `excel` are NOT installed on this build and need network to get.
 *
 * **Fairness rules this run holds, each of which has burned someone here:**
 *
 *   - **ONE corpus.** Generated once into the native table, then every other format is a `COPY` of
 *     that same table, so no generator variation can leak into a size or query number.
 *   - **The native table is CHECKPOINTed, armed and VERIFIED**, before its size or its queries are
 *     measured. An uncompressed native table is a different artefact — a plain `CHECKPOINT` after
 *     an ingest path silently does nothing at some sizes, so this arms it with a throwaway write and
 *     fails loudly if the uncompressed segment count does not drop.
 *   - **Row group size is left at the default everywhere.** It is the unit of query cost
 *     (2026-08-24), so varying it here would confound the format question with a settled one.
 *   - **One file per format.** File count is a separate, already-measured axis; mixing it in would
 *     repeat exactly the confound that produced the per-file error.
 *   - **The battery is character-for-character the one in `parquet-query.mjs`** so numbers are
 *     comparable across the two files. Keep them in sync by hand; do not "improve" one alone.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/storage-formats.mjs
 *   ROWS=25000000 node .../storage-formats.mjs
 *   ROWS=1000000 SKIP_TEXT=1 node .../storage-formats.mjs    # columnar formats only, fast
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS || 5_000_000);
const GEN_CHUNK = Number(process.env.GEN_CHUNK || 100_000);
const REPEATS = Number(process.env.REPEATS || 3);
/** CSV and NDJSON re-parse the whole file per query, so they get fewer repeats by default. */
const TEXT_REPEATS = Number(process.env.TEXT_REPEATS || 1);
const SKIP_TEXT = process.env.SKIP_TEXT === '1';
const SPOOL = process.env.SPOOL || '/tmp/duck-fmt-spool';
const DB = process.env.DB || '/tmp/duck-fmt.db';

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/**
 * The query battery — **kept identical to `parquet-query.mjs`** so the two files' numbers can be
 * read side by side. `count(*)` is the metadata thermometer and touches no column data; never quote
 * it as a workload.
 */
const QUERIES = [
    ['count(*) [metadata only]', 'SELECT count(*) FROM t'],
    // `category` is alpha/beta/gamma/delta/epsilon - NOT `cat-N`. Until 2026-08-24 this read
    // `'cat-3'` and matched ZERO rows, so it timed a scan whose filter never passed anything.
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

const METADATA_QUERY = QUERIES[0][0];

async function timeQueries(connection, repeats) {
    const out = {};
    for (const [name, sql] of QUERIES) {
        const samples = [];
        for (let i = 0; i < repeats; i++) {
            const start = performance.now();
            await (await connection.run(sql)).getRowsJson();
            samples.push(performance.now() - start);
        }
        const warm = samples.slice(1).length ? median(samples.slice(1)) : samples[0];
        out[name] = { cold: samples[0], warm };
    }
    return out;
}

/**
 * How much of a native table is still uncompressed.
 *
 * A plain `CHECKPOINT` right after an ingest path can return in 0 ms having compressed nothing, with
 * no error, so every size number below has to be taken against a VERIFIED checkpoint.
 */
async function segments(frameOrConn, table) {
    // `frame.query()` is JSON-rendered, so the count arrives as a STRING - Number() it, do not trust it
    const rows = await frameOrConn.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}') GROUP BY 1 ORDER BY 2 DESC`
    );
    const counts = rows.map(([kind, n]) => [String(kind), Number(n)]);
    const all = counts.reduce((a, [, n]) => a + n, 0);
    const uncompressed = counts.find(([k]) => k === 'Uncompressed')?.[1] ?? 0;
    return { counts, all, uncompressed };
}

async function fileBytes(path) {
    let total = 0;
    for (const suffix of ['', '.wal']) {
        try { total += (await stat(path + suffix)).size; } catch { /* not created */ }
    }
    return total;
}

/** The WAL on its own. After a verified checkpoint this should be ~0; if it is not, the native size
 * figure is inflated by writes a real deployment would already have flushed. */
async function walBytes(path) {
    try { return (await stat(`${path}.wal`)).size; } catch { return 0; }
}

/* ------------------------------------------------------------------ run */

for (const path of [DB, `${DB}.wal`]) if (existsSync(path)) await rm(path, { force: true });
await rm(SPOOL, { recursive: true, force: true });
await mkdir(SPOOL, { recursive: true });

heading(`STORAGE FORMATS — ${num(ROWS)} rows, 30-column corpus`);

/* ---- phase 1: the corpus, into the native format ---- */

const frame = await DuckFrame.create(CONFIG, { name: 'corpus', database: DB });
/** `create` uniquifies the name, so ask the frame rather than assuming `corpus`. */
const TABLE = frame.table ?? 'corpus';
let built = 0;
const genStart = performance.now();
while (built < ROWS) {
    const take = Math.min(GEN_CHUNK, ROWS - built);
    await frame.append({ records: makeRecords(take, built + 1) });
    built += take;
}
const buildMs = performance.now() - genStart;
note(`built the native table in ${(buildMs / 1000).toFixed(1)}s`
    + ` (includes coercion — the PRODUCER leg, not a format cost)`);

// arm the checkpoint with a throwaway write, then verify it actually compressed something
const before = await segments(frame, TABLE);
await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
await frame.query('DROP TABLE _arm');
const ckptStart = performance.now();
await frame.query('CHECKPOINT');
const ckptMs = performance.now() - ckptStart;
const after = await segments(frame, TABLE);
/**
 * **Guard the checkpoint, but guard it PROPORTIONALLY.** The hazard is a table that is still
 * essentially uncompressed - not a handful of residual segments, which is normal: automatic
 * checkpointing fires during ingest at the 16 MiB default and does most of the work already, and some
 * segments (high-entropy strings) have no scheme that beats Uncompressed. A strict
 * "the count must drop" check false-positives on exactly that, so the test is "is the table
 * substantially compressed by the time we measure it".
 */
const uncompressedShare = after.all ? after.uncompressed / after.all : 0;
if (uncompressedShare > 0.10 && after.uncompressed >= before.uncompressed) {
    throw new Error(`CHECKPOINT did nothing and the table is ${(uncompressedShare * 100).toFixed(0)}%`
        + ` uncompressed (${after.uncompressed} of ${after.all} segments, was ${before.uncompressed}).`
        + ' Every size number below would be measured on an uncompressed table.');
}
note(`CHECKPOINT ${ckptMs.toFixed(0)} ms, uncompressed segments`
    + ` ${before.uncompressed} -> ${after.uncompressed} of ${after.all}`
    + ` (${(uncompressedShare * 100).toFixed(1)}% uncompressed at measurement time)`);

heading('WHAT THE NATIVE FORMAT DID WITH THE DATA — compression per segment');
for (const [kind, n] of after.counts) {
    note(`  ${kind.padEnd(16)} ${String(n).padStart(7)} segments`);
}

const nativeBytes = await fileBytes(DB);
const nativeWal = await walBytes(DB);
if (nativeWal > nativeBytes * 0.02) {
    note(`  WARNING: ${mb(nativeWal)} of that is still WAL — the checkpoint did not fully flush,`
        + ' so the native size below is inflated');
}

/* ---- phase 2: write every other format from that same table ---- */

const FORMATS = [
    ['parquet zstd', 'pq-zstd.parquet', "(FORMAT parquet, COMPRESSION zstd)", 'read_parquet', false],
    ['parquet snappy', 'pq-snappy.parquet', "(FORMAT parquet, COMPRESSION snappy)", 'read_parquet', false],
    ['parquet none', 'pq-none.parquet', "(FORMAT parquet, COMPRESSION uncompressed)", 'read_parquet', false],
    ['arrow IPC', 'data.arrow', '(FORMAT arrow)', 'read_arrow', false],
    ['csv', 'data.csv', '(FORMAT csv)', 'read_csv', true],
    ['ndjson', 'data.json', '(FORMAT json)', 'read_ndjson', true],
];

await frame.query('LOAD nanoarrow');

heading('WRITE COST AND SIZE ON DISK');
note(`  ${'format'.padEnd(16)}${'write'.padStart(10)}${'size'.padStart(13)}${'vs native'.padStart(12)}`);
note(`  ${'native (.db)'.padEnd(16)}${'—'.padStart(10)}${mb(nativeBytes).padStart(13)}${'1.00x'.padStart(12)}`);

const written = [];
for (const [label, file, opts, reader, isText] of FORMATS) {
    if (isText && SKIP_TEXT) continue;
    const path = join(SPOOL, file);
    const start = performance.now();
    await frame.query(`COPY ${TABLE} TO '${path}' ${opts}`);
    const ms = performance.now() - start;
    const bytes = await fileBytes(path);
    written.push({ label, path, reader, isText, ms, bytes });
    note(`  ${label.padEnd(16)}${`${(ms / 1000).toFixed(1)}s`.padStart(10)}${mb(bytes).padStart(13)}`
        + `${`${(bytes / nativeBytes).toFixed(2)}x`.padStart(12)}`);
}

/**
 * **Release the native database before anything re-opens the file.** Phase 3 attaches it READ_ONLY
 * from a fresh instance; holding the writer open at the same time is asking for a lock or, worse, a
 * half-flushed read.
 */
await closeDuckDatabase(DB);

/* ---- phase 3: the query battery, per format ---- */

const results = [];

async function battery(label, setup, repeats, kind) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run('LOAD nanoarrow');
    const start = performance.now();
    await setup(connection);
    const setupMs = performance.now() - start;
    const queries = await timeQueries(connection, repeats);
    connection.disconnectSync();
    instance.closeSync();
    results.push({ label, kind, setupMs, queries });
    return results.at(-1);
}

heading('QUERY BATTERY — warm ms (median of repeats after the first)');
const header = QUERIES.map(([n]) => n.slice(0, 15).padStart(16)).join('');
console.log(`    ${'source'.padEnd(20)}${'setup'.padStart(9)}${header}`);

const show = (r) => console.log(`    ${r.label.padEnd(20)}${r.setupMs.toFixed(0).padStart(9)}`
    + QUERIES.map(([n]) => r.queries[n].warm.toFixed(1).padStart(16)).join(''));

// the native table itself, attached read-only — the baseline every other row is measured against
show(await battery('native table', async (c) => {
    await c.run(`ATTACH '${DB}' AS nat (READ_ONLY)`);
    await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM nat.${TABLE}`);
}, REPEATS, 'native'));

// the same file through read_duckdb(), which is a table function rather than an attached catalogue
show(await battery('native read_duckdb', async (c) => {
    // `table_name` is a NAMED parameter on read_duckdb, not positional
    await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_duckdb('${DB}', table_name := '${TABLE}')`);
}, REPEATS, 'native'));

for (const w of written) {
    show(await battery(w.label, async (c) => {
        await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM ${w.reader}('${w.path}')`);
    }, w.isText ? TEXT_REPEATS : REPEATS, w.isText ? 'text' : 'columnar'));
}

// and the shape the worker would actually adopt: materialise from Parquet into memory
const pq = written.find((w) => w.label === 'parquet zstd');
if (pq) {
    show(await battery('TABLE from parquet', async (c) => {
        await c.run(`CREATE OR REPLACE TABLE t AS SELECT * FROM read_parquet('${pq.path}')`);
    }, REPEATS, 'materialised'));
}

/* ---- phase 4: cost to load each format into a native table ---- */

heading('LOAD TO A NATIVE TABLE — the worker ingest leg, per source format');
for (const w of written) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run('LOAD nanoarrow');
    const start = performance.now();
    await connection.run(`CREATE TABLE t AS SELECT * FROM ${w.reader}('${w.path}')`);
    const ms = performance.now() - start;
    connection.disconnectSync();
    instance.closeSync();
    note(`  ${w.label.padEnd(16)} ${`${(ms / 1000).toFixed(2)}s`.padStart(9)}`
        + `  ${num(ROWS / (ms / 1000))} rows/s`);
}

/* ---- summary ---- */

heading('SUMMARY — total warm battery time, and the metadata thermometer');
const native = results.find((r) => r.label === 'native table');
const total = (r) => QUERIES.reduce((a, [n]) => a + r.queries[n].warm, 0);
note(`  ${'source'.padEnd(20)}${'battery total'.padStart(15)}${'vs native'.padStart(12)}${'count(*)'.padStart(12)}`);
for (const r of results) {
    note(`  ${r.label.padEnd(20)}${`${total(r).toFixed(0)} ms`.padStart(15)}`
        + `${`${(total(r) / total(native)).toFixed(2)}x`.padStart(12)}`
        + `${`${r.queries[METADATA_QUERY].warm.toFixed(1)} ms`.padStart(12)}`);
}
note('  text formats ran fewer repeats, so their warm figure includes more first-touch cost');

await rm(SPOOL, { recursive: true, force: true });
for (const suffix of ['', '.wal']) {
    if (existsSync(DB + suffix)) await rm(DB + suffix, { force: true });
}
process.exit(0);
