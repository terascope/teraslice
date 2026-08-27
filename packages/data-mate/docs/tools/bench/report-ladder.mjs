/**
 * THE FORMAT LADDER — every storage format DuckDB reads, at 100k -> 100M, over the full battery.
 *
 * Written for the boss-facing report (2026-08-25). It answers two of its five points in one pass,
 * because they share a corpus and separating them would double the build cost:
 *
 *   POINT 1 — query performance over Parquet vs the native format vs everything else, per scale.
 *   POINT 3 — a DuckDB table held IN MEMORY against the same table FILE-BACKED.
 *
 * **Why this exists when `storage-formats.mjs` already measures formats.** That script runs ONE
 * scale per invocation and has no in-memory/file-backed axis. The scale ladder is the question here
 * - the format ranking is already known at 5M and 25M, and what nobody has is whether it HOLDS from
 * 100k to 100M, which is the range spaces actually spans.
 *
 * **The fairness rules, inherited from `storage-formats.mjs` and extended:**
 *
 *   - ONE corpus per scale, generated once into the native table; every other format is a `COPY` of
 *     that same table, so no generator variance can reach a size or a query number.
 *   - **BOTH native tables are CHECKPOINTed, armed and VERIFIED** - the file-backed one and the
 *     in-memory one. DuckDB only compresses at checkpoint, so comparing a compressed file against an
 *     uncompressed memory table would measure compression and call it storage. This is the rule that
 *     makes POINT 3 mean anything.
 *   - Row group size left at the default everywhere. It is the unit of query cost, so varying it
 *     here would confound this question with a settled one.
 *   - One file per format. File count is POINT 4's axis, measured separately in `report-layout.mjs`.
 *   - The battery is the one from `parquet-query.mjs` / `storage-formats.mjs`, unchanged.
 *
 * **The envelope is NOT the shared `WORKER` constant, deliberately.** `WORKER` is 48 GiB, which is
 * ABOVE this 36 GB machine's physical memory - and a `memory_limit` above the real cap is exactly
 * what produced the bogus "OOMs and will not spill" finding, because DuckDB never spills and the
 * kernel kills the process instead. This run sets 24 GiB and prints it.
 *
 * Run (serially - never two DuckDB benches at once):
 *   node packages/data-mate/docs/tools/bench/report-ladder.mjs
 *   SCALES=100000,500000 node .../report-ladder.mjs
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const SCALES = (process.env.SCALES || '100000,500000,1000000,10000000,100000000')
    .split(',').map(Number);
/** Above this, the long-tail formats are skipped: Arrow is 30x and CSV/NDJSON 16x, already settled. */
const NARROW_ABOVE = Number(process.env.NARROW_ABOVE || 1_000_000);
const GEN_CHUNK = Number(process.env.GEN_CHUNK || 100_000);
const REPEATS = Number(process.env.REPEATS || 3);
const TEXT_REPEATS = Number(process.env.TEXT_REPEATS || 1);
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '24GiB';
const SPOOL = process.env.SPOOL || '/tmp/duck-ladder-spool';
const DB = process.env.DB || '/tmp/duck-ladder.db';
const OUT = process.env.OUT
    || new URL('../results/ladder.json', import.meta.url).pathname;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const rssMB = () => Math.round(process.memoryUsage.rss() / 1024 / 1024);

/** Identical to `parquet-query.mjs` and `storage-formats.mjs`. Do not "improve" one alone. */
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

async function segments(runner, table) {
    const rows = await runner(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}') GROUP BY 1 ORDER BY 2 DESC`
    );
    const counts = rows.map((r) => [String(r[0]), Number(r[1])]);
    const all = counts.reduce((a, [, n]) => a + n, 0);
    return { counts, all, uncompressed: counts.find(([k]) => k === 'Uncompressed')?.[1] ?? 0 };
}

/**
 * Arm a checkpoint, take it, and VERIFY it did something.
 *
 * A plain `CHECKPOINT` after an ingest path returns in 0 ms having compressed nothing, with no
 * error, at some sizes - so it needs a real write since the last checkpoint to arm it, and the
 * result has to be checked rather than assumed. The share test rather than a strict drop: some
 * residual Uncompressed segments are normal (high-entropy strings have no scheme that beats it).
 */
async function checkpointVerified(runner, table, where) {
    const before = await segments(runner, table);
    await runner('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await runner('DROP TABLE _arm');
    const start = performance.now();
    await runner('CHECKPOINT');
    const ms = performance.now() - start;
    const after = await segments(runner, table);
    const share = after.all ? after.uncompressed / after.all : 0;
    if (share > 0.10 && after.uncompressed >= before.uncompressed) {
        throw new Error(`CHECKPOINT (${where}) did nothing - ${(share * 100).toFixed(0)}% still`
            + ` uncompressed (${after.uncompressed}/${after.all}). Every number would be wrong.`);
    }
    return { ms, share, before: before.uncompressed, after: after.uncompressed, all: after.all };
}

async function fileBytes(path) {
    let total = 0;
    for (const suffix of ['', '.wal']) {
        try { total += (await stat(path + suffix)).size; } catch { /* not created */ }
    }
    return total;
}

/* ------------------------------------------------------------------ run */

heading(`FORMAT LADDER — scales ${SCALES.map(num).join(', ')}`);
note(`memory_limit=${MEMORY_LIMIT} (BELOW this box's 36 GB - the shared WORKER constant is 48 GiB,`);
note('which is above physical memory and is what produced the bogus "will not spill" finding)');
note(`full format sweep at <= ${num(NARROW_ABOVE)}; native + parquet zstd/snappy above it`);

const all = [];

for (const ROWS of SCALES) {
    const narrow = ROWS > NARROW_ABOVE;
    heading(`${num(ROWS)} ROWS ${narrow ? '(narrow sweep)' : '(full sweep)'}`);

    for (const p of [DB, `${DB}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    await rm(SPOOL, { recursive: true, force: true });
    await mkdir(SPOOL, { recursive: true });

    /* ---- phase 1: the corpus, into a FILE-BACKED native table ---- */

    const frame = await DuckFrame.create(CONFIG, { name: 'corpus', database: DB });
    const TABLE = frame.table ?? 'corpus';
    await frame.query(`SET memory_limit = '${MEMORY_LIMIT}'`);
    let built = 0;
    const genStart = performance.now();
    while (built < ROWS) {
        const take = Math.min(GEN_CHUNK, ROWS - built);
        await frame.append({ records: makeRecords(take, built + 1) });
        built += take;
    }
    const buildMs = performance.now() - genStart;
    const buildRss = rssMB();
    note(`built file-backed native table in ${(buildMs / 1000).toFixed(1)}s`
        + `  (${num(ROWS / (buildMs / 1000))} rows/s - this is the PRODUCER leg, coercion included)`);

    const runner = (sql) => frame.query(sql);
    const ckpt = await checkpointVerified(runner, TABLE, 'file-backed');
    note(`CHECKPOINT ${ckpt.ms.toFixed(0)} ms - uncompressed segments ${ckpt.before} -> ${ckpt.after}`
        + ` of ${ckpt.all} (${(ckpt.share * 100).toFixed(1)}%)`);

    const nativeBytes = await fileBytes(DB);

    /* ---- phase 2: write every other format from that same table ---- */

    const FORMATS = [
        ['parquet zstd', 'pq-zstd.parquet', '(FORMAT parquet, COMPRESSION zstd)', 'read_parquet', false, true],
        ['parquet snappy', 'pq-snappy.parquet', '(FORMAT parquet, COMPRESSION snappy)', 'read_parquet', false, true],
        ['parquet none', 'pq-none.parquet', '(FORMAT parquet, COMPRESSION uncompressed)', 'read_parquet', false, false],
        ['arrow IPC', 'data.arrow', '(FORMAT arrow)', 'read_arrow', false, false],
        ['csv', 'data.csv', '(FORMAT csv)', 'read_csv', true, false],
        ['ndjson', 'data.json', '(FORMAT json)', 'read_ndjson', true, false],
    ].filter(([, , , , , keepWhenNarrow]) => !narrow || keepWhenNarrow);

    await frame.query('LOAD nanoarrow');

    note('');
    note(`  ${'format'.padEnd(18)}${'write'.padStart(10)}${'size'.padStart(13)}${'vs native'.padStart(11)}${'MB/million'.padStart(12)}`);
    note(`  ${'native (.db)'.padEnd(18)}${'—'.padStart(10)}${mb(nativeBytes).padStart(13)}`
        + `${'1.00x'.padStart(11)}${(nativeBytes / 1024 / 1024 / (ROWS / 1e6)).toFixed(1).padStart(12)}`);

    const written = [];
    for (const [label, file, opts, reader, isText] of FORMATS) {
        const path = join(SPOOL, file);
        const start = performance.now();
        await frame.query(`COPY ${TABLE} TO '${path}' ${opts}`);
        const ms = performance.now() - start;
        const bytes = await fileBytes(path);
        written.push({ label, path, reader, isText, writeMs: ms, bytes });
        note(`  ${label.padEnd(18)}${`${(ms / 1000).toFixed(1)}s`.padStart(10)}${mb(bytes).padStart(13)}`
            + `${`${(bytes / nativeBytes).toFixed(2)}x`.padStart(11)}`
            + `${(bytes / 1024 / 1024 / (ROWS / 1e6)).toFixed(1).padStart(12)}`);
    }

    /** Row-group census on the Parquet, so the row-group law can be checked at every scale. */
    const pq = written.find((w) => w.label === 'parquet zstd');
    const groupsRow = await frame.query(
        `SELECT count(*) FROM parquet_file_metadata('${pq.path}')`
    );
    const rowGroups = Number(
        (await frame.query(`SELECT sum(num_row_groups) FROM parquet_file_metadata('${pq.path}')`))[0][0]
    );
    note(`  parquet zstd holds ${rowGroups} row group(s) in 1 file`
        + ` (default 122,880 rows/group; ${(ROWS / rowGroups / 1000).toFixed(0)}k rows each)`);
    void groupsRow;

    /** Release the writer before anything re-opens the file read-only. */
    await closeDuckDatabase(DB);

    /* ---- phase 3: the battery, per source ---- */

    const results = [];

    async function battery(label, kind, setup, repeats) {
        const instance = await DuckDBInstance.create(':memory:');
        const connection = await instance.connect();
        await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
        await connection.run('LOAD nanoarrow');
        let setupMs = 0; let queries = null; let failure = null; let peakRss = 0;
        let duckMemBytes = null;
        try {
            const start = performance.now();
            await setup(connection);
            setupMs = performance.now() - start;
            peakRss = rssMB();
            queries = await timeQueries(connection, repeats);
            peakRss = Math.max(peakRss, rssMB());
            // DuckDB's OWN footprint. Process RSS accumulates across every phase of this script,
            // so it cannot say what one source costs; this can.
            const mem = await (await connection.run(
                'SELECT sum(memory_usage_bytes) FROM duckdb_memory()'
            )).getRowsJson();
            duckMemBytes = Number(mem?.[0]?.[0] ?? 0);
        } catch (err) {
            failure = String(err.message || err).split('\n')[0];
        }
        connection.disconnectSync();
        instance.closeSync();
        const row = { label, kind, setupMs, queries, failure, peakRss, duckMemBytes };
        results.push(row);
        if (failure) {
            console.log(`    ${label.padEnd(24)}${'FAILED'.padStart(9)}  ${failure}`);
        } else {
            console.log(`    ${label.padEnd(24)}${setupMs.toFixed(0).padStart(9)}`
                + QUERIES.map(([n]) => queries[n].warm.toFixed(1).padStart(12)).join(''));
        }
        return row;
    }

    note('');
    note('QUERY BATTERY — warm ms (median of repeats after the first)');
    console.log(`    ${'source'.padEnd(24)}${'setup'.padStart(9)}`
        + QUERIES.map(([n]) => n.slice(0, 11).padStart(12)).join(''));

    // ---- POINT 3's pair: the SAME native data, on disk and in memory, both checkpointed ----

    await battery('native FILE (attach)', 'native-file', async (c) => {
        await c.run(`ATTACH '${DB}' AS nat (READ_ONLY)`);
        await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM nat.${TABLE}`);
    }, REPEATS);

    await battery('native MEMORY', 'native-memory', async (c) => {
        await c.run(`ATTACH '${DB}' AS nat (READ_ONLY)`);
        await c.run(`CREATE OR REPLACE TABLE t AS SELECT * FROM nat.${TABLE}`);
        await c.run('DETACH nat');
        // compress the in-memory copy too, or this compares compressed-on-disk with
        // uncompressed-in-memory and calls the difference "storage"
        await checkpointVerified((sql) => c.run(sql).then((r) => r.getRowsJson()), 't', 'in-memory');
    }, REPEATS);

    // ---- POINT 1: every format, as a view over its file ----

    for (const w of written) {
        await battery(w.label, w.isText ? 'text' : 'columnar', async (c) => {
            await c.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM ${w.reader}('${w.path}')`);
        }, w.isText ? TEXT_REPEATS : REPEATS);
    }

    // ---- the two materialised shapes the worker could actually adopt ----

    await battery('TABLE from pq (memory)', 'materialised-memory', async (c) => {
        await c.run(`CREATE OR REPLACE TABLE t AS SELECT * FROM read_parquet('${pq.path}')`);
        await checkpointVerified((sql) => c.run(sql).then((r) => r.getRowsJson()), 't', 'pq->memory');
    }, REPEATS);

    const fileDb = `${DB}.mat`;
    for (const p of [fileDb, `${fileDb}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    await battery('TABLE from pq (file)', 'materialised-file', async (c) => {
        await c.run(`ATTACH '${fileDb}' AS mat`);
        await c.run(`CREATE OR REPLACE TABLE mat.t AS SELECT * FROM read_parquet('${pq.path}')`);
        await c.run('CHECKPOINT mat');
        await c.run('CREATE OR REPLACE VIEW t AS SELECT * FROM mat.t');
    }, REPEATS);
    const matBytes = await fileBytes(fileDb);

    /* ---- summary for this scale ---- */

    const total = (r) => (r.queries
        ? QUERIES.reduce((a, [n]) => a + r.queries[n].warm, 0)
        : null);
    const base = results.find((r) => r.kind === 'native-file');
    note('');
    note(`  ${'source'.padEnd(24)}${'battery'.padStart(12)}${'vs native file'.padStart(16)}${'duckdb mem'.padStart(13)}${'peak RSS'.padStart(11)}`);
    for (const r of results) {
        const t = total(r);
        note(`  ${r.label.padEnd(24)}${(t == null ? 'FAILED' : `${t.toFixed(0)} ms`).padStart(12)}`
            + `${(t == null ? '—' : `${(t / total(base)).toFixed(2)}x`).padStart(16)}`
            + `${(r.duckMemBytes == null ? '—' : mb(r.duckMemBytes)).padStart(13)}`
            + `${`${r.peakRss} MB`.padStart(11)}`);
    }

    all.push({
        rows: ROWS,
        narrow,
        buildMs,
        buildRss,
        checkpoint: ckpt,
        nativeBytes,
        materialisedFileBytes: matBytes,
        rowGroups,
        formats: written.map(({ label, writeMs, bytes }) => ({ label, writeMs, bytes })),
        battery: results.map(({ label, kind, setupMs, queries, failure, peakRss, duckMemBytes }) => ({
            label, kind, setupMs, queries, failure, peakRss, duckMemBytes,
        })),
    });

    await writeFile(OUT, JSON.stringify({ queries: QUERIES.map(([n]) => n), scales: all }, null, 2));
    note(`  results -> ${OUT}`);

    await closeDuckDatabase(fileDb).catch(() => {});
    await rm(SPOOL, { recursive: true, force: true });
    for (const p of [DB, `${DB}.wal`, fileDb, `${fileDb}.wal`]) {
        if (existsSync(p)) await rm(p, { force: true });
    }
}

heading('DONE');
note(`results written to ${OUT}`);
process.exit(0);
