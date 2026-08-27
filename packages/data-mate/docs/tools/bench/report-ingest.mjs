/**
 * POINT 2 — APPEND INTO A TABLE vs QUERY THE PARQUET PAYLOADS. Where is break-even?
 *
 * Written for the boss-facing report (2026-08-25).
 *
 * **The decision this measures.** `qpl-search-api` returns <=100k records per slice as Parquet. The
 * worker receives every payload's bytes and has exactly three things it can do with them:
 *
 *   A. **append** each payload into one DuckDB table            (today's design)
 *   B. **persist the bytes** and query them as a Parquet view   (ingest becomes a byte copy)
 *   C. persist the bytes, then **materialise ONE table** at quiesce (B's ingest, A's query cost)
 *
 * **The producer leg is excluded from all three**, because all three pay it identically: the
 * payloads are generated ONCE into Parquet files before the clock starts. What is measured is only
 * what the worker does with a payload already in hand. Mixing the producer in is how an ingest
 * comparison turns into a coercion benchmark - coercion is 42-58% of `fromRecords` and is shared.
 *
 * **Why break-even and not a ratio.** The cost of A is paid ONCE PER JOB; its benefit is PER QUERY.
 * A ratio therefore decides nothing. The number that decides it is
 *
 *     Q_required = extra_one_time_cost / saved_per_query
 *
 * compared against the real query count. This script computes and prints it for every pair, and
 * prints the two columns it derives from so the arithmetic can be checked rather than trusted.
 *
 * **Latency is reported separately from throughput**, because they are different questions:
 * `ingest` is wall time to absorb every payload, `time-to-queryable` is how long after the LAST
 * payload lands before a query can run. B is ~0 on the second and A is not.
 *
 * Run (serially - never two DuckDB benches at once):
 *   node packages/data-mate/docs/tools/bench/report-ingest.mjs
 *   SCALES=1000000 PAYLOADS=50000 node .../report-ingest.mjs
 */
import { rm, mkdir, stat, writeFile, readdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const SCALES = (process.env.SCALES || '1000000,10000000,100000000').split(',').map(Number);
/** Payload-size sweep, run at this scale only - it is the axis that decides everything. */
const SWEEP_AT = Number(process.env.SWEEP_AT || 10_000_000);
const SWEEP = (process.env.SWEEP || '10000,50000,100000').split(',').map(Number);
const DEFAULT_PAYLOAD = Number(process.env.PAYLOADS || 50_000);
const REPEATS = Number(process.env.REPEATS || 3);
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '24GiB';
const ROOT = process.env.ROOT || '/tmp/duck-ingest';
const OUT = process.env.OUT || new URL('../results/ingest.json', import.meta.url).pathname;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** Identical to the ladder's and `parquet-query.mjs`'s. */
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

/**
 * Aggregation-shaped subset. The full battery's total is dragged toward 1.0x by `top 100 rows`,
 * which is scan-bound rather than metadata-bound and was 82% of one recorded "saving". Break-even
 * is therefore reported BOTH ways - a battery total hides its own distribution.
 */
const AGG_ONLY = new Set([
    'search: 2 predicates', 'search: range + eq', 'search: IN list',
    'agg: 1 key + 3 aggs', 'agg: 2 keys + 3 aggs', 'agg: filtered + ordered', 'project 1 col',
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

async function fileBytes(path) {
    let total = 0;
    for (const suffix of ['', '.wal']) {
        try { total += (await stat(path + suffix)).size; } catch { /* not created */ }
    }
    return total;
}

async function duckMem(connection) {
    const rows = await (await connection.run(
        'SELECT sum(memory_usage_bytes) FROM duckdb_memory()'
    )).getRowsJson();
    return Number(rows?.[0]?.[0] ?? 0);
}

/**
 * THE PRODUCER LEG — generate the payloads as Parquet, once, OUTSIDE every measurement.
 *
 * This is what `qpl-search-api` does per slice. All three worker designs receive exactly these
 * bytes, so counting it would add the same constant to all three and change no comparison.
 */
async function producePayloads(dir, rows, payloadRows) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const db = `${dir}.producer.db`;
    for (const p of [db, `${db}.wal`]) if (existsSync(p)) await rm(p, { force: true });

    let made = 0; let n = 0;
    const start = performance.now();
    while (made < rows) {
        const take = Math.min(payloadRows, rows - made);
        const frame = await DuckFrame.create(CONFIG, { name: `p${n}`, database: db });
        await frame.append({ records: makeRecords(take, made + 1) });
        await frame.writeParquet(join(dir, `part-${String(n).padStart(5, '0')}.parquet`));
        await frame.destroy();
        made += take; n += 1;
    }
    const ms = performance.now() - start;
    await closeDuckDatabase(db);
    for (const p of [db, `${db}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    return { count: n, ms, bytes: await dirBytes(dir) };
}

/* ------------------------------------------------------------------ paths */

/** A. append each payload into ONE table, then checkpoint at quiesce. */
async function pathAppend(payloadDir, files, dbPath) {
    for (const p of [dbPath, `${dbPath}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    const frame = await DuckFrame.create(CONFIG, { name: 'assembled', database: dbPath });
    await frame.query(`SET memory_limit = '${MEMORY_LIMIT}'`);
    // Suppress automatic checkpointing DURING ingest: it charges compression to ingest and leaves
    // the table half-compressed, so the final checkpoint pays to finish a mixed table. Measured at
    // 31% of append cost. One checkpoint at quiesce is the settled recipe.
    await frame.query("SET checkpoint_threshold = '1TB'");

    const appendMs = [];
    const start = performance.now();
    for (const f of files) {
        const t = performance.now();
        await frame.append({ parquet: join(payloadDir, f) });
        appendMs.push(performance.now() - t);
    }
    const ingestMs = performance.now() - start;

    // time-to-queryable = the checkpoint that has to happen before the table is in its
    // steady-state (compressed) form. Armed and verified, or it can silently do nothing.
    const ckStart = performance.now();
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    await frame.query('CHECKPOINT');
    const checkpointMs = performance.now() - ckStart;

    const bytes = await fileBytes(dbPath);
    const table = frame.table ?? 'assembled';
    await closeDuckDatabase(dbPath);
    return {
        ingestMs, checkpointMs, bytes, table,
        perAppendMs: median(appendMs),
        readyMs: ingestMs + checkpointMs,
    };
}

/** B. persist the received bytes verbatim. The worker decodes nothing. */
async function pathLand(payloadDir, files, storeDir) {
    await rm(storeDir, { recursive: true, force: true });
    await mkdir(storeDir, { recursive: true });
    const start = performance.now();
    for (const f of files) {
        await copyFile(join(payloadDir, f), join(storeDir, f));
    }
    const ingestMs = performance.now() - start;
    return { ingestMs, checkpointMs: 0, readyMs: ingestMs, bytes: await dirBytes(storeDir) };
}

/** C. land the bytes, then materialise ONE table at quiesce. */
async function pathLandThenMaterialise(storeDir, dbPath) {
    for (const p of [dbPath, `${dbPath}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    const instance = await DuckDBInstance.create(dbPath);
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const start = performance.now();
    await connection.run(
        `CREATE TABLE assembled AS SELECT * FROM read_parquet('${join(storeDir, '*.parquet')}')`
    );
    await connection.run('CHECKPOINT');
    const materialiseMs = performance.now() - start;
    connection.disconnectSync();
    instance.closeSync();
    return { materialiseMs, bytes: await fileBytes(dbPath) };
}

/* ------------------------------------------------------------------ battery */

async function battery(setup) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const start = performance.now();
    await setup(connection);
    const setupMs = performance.now() - start;
    const queries = await timeQueries(connection, REPEATS);
    const mem = await duckMem(connection);
    connection.disconnectSync();
    instance.closeSync();
    return { setupMs, queries, duckMemBytes: mem };
}

const totalOf = (queries, subset) => QUERIES
    .filter(([n]) => (subset ? subset.has(n) : true))
    .reduce((a, [n]) => a + queries[n].warm, 0);

/* ------------------------------------------------------------------ run */

heading('POINT 2 — APPEND A TABLE vs QUERY THE PAYLOADS');
note(`memory_limit=${MEMORY_LIMIT}; producer leg EXCLUDED from every path (all three pay it)`);

await mkdir(ROOT, { recursive: true });
const all = [];

const CASES = [];
for (const rows of SCALES) CASES.push({ rows, payload: DEFAULT_PAYLOAD });
for (const payload of SWEEP) {
    if (payload !== DEFAULT_PAYLOAD) CASES.push({ rows: SWEEP_AT, payload });
}

for (const { rows, payload } of CASES) {
    heading(`${num(rows)} rows in ${num(payload)}-row payloads`);

    const payloadDir = join(ROOT, `payloads-${rows}-${payload}`);
    const produced = await producePayloads(payloadDir, rows, payload);
    const files = (await readdir(payloadDir)).filter((f) => f.endsWith('.parquet')).sort();
    note(`producer: ${num(produced.count)} payloads, ${(produced.ms / 1000).toFixed(1)}s,`
        + ` ${mb(produced.bytes)} on the wire  [EXCLUDED from the comparison]`);

    const dbA = join(ROOT, 'append.db');
    const storeB = join(ROOT, 'store');
    const dbC = join(ROOT, 'materialised.db');

    const a = await pathAppend(payloadDir, files, dbA);
    const b = await pathLand(payloadDir, files, storeB);
    const c = await pathLandThenMaterialise(storeB, dbC);

    note('');
    note(`  ${'path'.padEnd(30)}${'ingest'.padStart(11)}${'+ckpt'.padStart(10)}${'ready'.padStart(10)}${'on disk'.padStart(12)}`);
    note(`  ${'A. append per payload'.padEnd(30)}${`${(a.ingestMs / 1000).toFixed(2)}s`.padStart(11)}`
        + `${`${(a.checkpointMs / 1000).toFixed(2)}s`.padStart(10)}`
        + `${`${(a.readyMs / 1000).toFixed(2)}s`.padStart(10)}${mb(a.bytes).padStart(12)}`);
    note(`  ${'B. land the bytes'.padEnd(30)}${`${(b.ingestMs / 1000).toFixed(2)}s`.padStart(11)}`
        + `${'—'.padStart(10)}${`${(b.readyMs / 1000).toFixed(2)}s`.padStart(10)}${mb(b.bytes).padStart(12)}`);
    note(`  ${'C. land, then materialise'.padEnd(30)}${`${(b.ingestMs / 1000).toFixed(2)}s`.padStart(11)}`
        + `${`${(c.materialiseMs / 1000).toFixed(2)}s`.padStart(10)}`
        + `${`${((b.ingestMs + c.materialiseMs) / 1000).toFixed(2)}s`.padStart(10)}${mb(c.bytes).padStart(12)}`);
    note(`  median append call: ${a.perAppendMs.toFixed(1)} ms over ${files.length} payloads`
        + ' (the payload-size sweep below decides whether this is per statement or per row)');

    /* ---- the battery on each ---- */

    const glob = join(storeB, '*.parquet');
    const bench = {
        'A. table (appended)': await battery(async (c2) => {
            await c2.run(`ATTACH '${dbA}' AS src (READ_ONLY)`);
            await c2.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM src.${a.table}`);
        }),
        'B. parquet view': await battery(async (c2) => {
            await c2.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${glob}')`);
        }),
        'C. table (materialised)': await battery(async (c2) => {
            await c2.run(`ATTACH '${dbC}' AS mat (READ_ONLY)`);
            await c2.run('CREATE OR REPLACE VIEW t AS SELECT * FROM mat.assembled');
        }),
    };

    note('');
    note('  QUERY BATTERY — warm ms');
    console.log(`    ${'path'.padEnd(26)}` + QUERIES.map(([n]) => n.slice(0, 11).padStart(12)).join(''));
    for (const [label, r] of Object.entries(bench)) {
        console.log(`    ${label.padEnd(26)}`
            + QUERIES.map(([n]) => r.queries[n].warm.toFixed(1).padStart(12)).join(''));
    }

    /* ---- break-even ---- */

    const rowsOut = [];
    const B = bench['B. parquet view'];
    for (const [label, key, extraMs] of [
        ['A. append vs B', 'A. table (appended)', a.readyMs - b.readyMs],
        ['C. materialise vs B', 'C. table (materialised)', c.materialiseMs],
    ]) {
        const r = bench[key];
        for (const [what, subset] of [['full battery', null], ['aggregation-shaped', AGG_ONLY]]) {
            const saved = totalOf(B.queries, subset) - totalOf(r.queries, subset);
            const q = saved > 0 ? extraMs / saved : Infinity;
            rowsOut.push({ pair: label, battery: what, savedPerQueryMs: saved, extraMs, breakEven: q });
        }
    }

    note('');
    note('  BREAK-EVEN — queries before the one-time cost is repaid');
    note(`  ${'pair'.padEnd(24)}${'battery'.padEnd(22)}${'saved/query'.padStart(14)}${'extra cost'.padStart(13)}${'break-even'.padStart(14)}`);
    for (const r of rowsOut) {
        note(`  ${r.pair.padEnd(24)}${r.battery.padEnd(22)}`
            + `${`${r.savedPerQueryMs.toFixed(1)} ms`.padStart(14)}`
            + `${`${(r.extraMs / 1000).toFixed(2)} s`.padStart(13)}`
            + `${(Number.isFinite(r.breakEven) ? `${Math.ceil(r.breakEven)} queries` : 'NEVER').padStart(14)}`);
    }

    all.push({
        rows,
        payload,
        payloadCount: files.length,
        producer: produced,
        paths: { append: a, land: b, materialise: c },
        battery: Object.fromEntries(Object.entries(bench)
            .map(([k, v]) => [k, { setupMs: v.setupMs, duckMemBytes: v.duckMemBytes, queries: v.queries }])),
        breakEven: rowsOut,
    });
    await writeFile(OUT, JSON.stringify({ queries: QUERIES.map(([n]) => n), cases: all }, null, 2));
    note(`  results -> ${OUT}`);

    await rm(payloadDir, { recursive: true, force: true });
    await rm(storeB, { recursive: true, force: true });
    for (const p of [dbA, `${dbA}.wal`, dbC, `${dbC}.wal`]) {
        if (existsSync(p)) await rm(p, { force: true });
    }
}

heading('DONE');
note(`results written to ${OUT}`);
process.exit(0);
