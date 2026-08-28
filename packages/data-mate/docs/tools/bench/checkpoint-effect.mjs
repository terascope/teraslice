/**
 * What does CHECKPOINT do to the MASTER TABLE, on the real ingest path?
 *
 * `tools/bench/udf-cardinality.mjs` found that a UDF is called once per DISTINCT value rather than
 * once per row - but only after a CHECKPOINT, which is what compresses the column. That was measured
 * on a `CREATE TABLE AS`. This measures the shape the worker actually builds: `DuckFrame.create` plus
 * many `append({ parquet })` calls, then the whole query suite before and after a checkpoint.
 *
 * Four things it answers:
 *   1. does the effect survive the append path, in-memory AND file-backed
 *   2. what it does to filters / group-by / distinct / sort / join / json, not just UDFs
 *   3. what the checkpoint itself costs, and what it does to memory
 *   4. what happens to payloads appended AFTER the checkpoint - does the win decay
 *
 *     node packages/data-mate/docs/tools/bench/checkpoint-effect.mjs
 *     ROWS=5000000 PAYLOADS=20 RUNS=2 node .../checkpoint-effect.mjs
*/
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const { DuckFrame, closeDuckDatabase, registerScalarFunction } = await import(
    dist('duck-frame/DuckFrame.js')
);
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const ROWS = Number(process.env.ROWS || 2_000_000);
const PAYLOADS = Number(process.env.PAYLOADS || 10);
const RUNS = Number(process.env.RUNS || 2);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-ckpt-'));

const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

let calls = 0;
const countingUdf = (database) => registerScalarFunction({
    name: 'udf_upper',
    parameter: 'Keyword',
    returns: { type: 'Keyword' },
    fn: (v) => {
        calls++;
        return String(v).toUpperCase();
    },
    database,
});

/** The payloads a run of fetches would deliver - built once, reused by both scenarios. */
log(`\nbuilding ${PAYLOADS} Parquet payloads, ${ROWS.toLocaleString()} rows total`);
const perPayload = Math.floor(ROWS / PAYLOADS);
const payloads = [];
for (let n = 0; n < PAYLOADS; n++) {
    const producer = await DuckFrame.fromRecords(
        CONFIG, makeRecords(perPayload, n + 1), { name: `p${n}` }
    );
    const file = path.join(scratch, `payload-${n}.parquet`);
    await producer.writeParquet(file);
    await producer.destroy();
    payloads.push(file);
}
await closeDuckDatabase();

/** One row out, and every value touched: what each op measures is in its name. */
function suite(table) {
    return [
        ['udf, low-card col', `SELECT sum(length(udf_upper("category"))) FROM "${table}"`],
        ['udf, unique col', `SELECT sum(length(udf_upper("email"))) FROM "${table}"`],
        ['sql upper, low-card', `SELECT sum(length(upper("category"))) FROM "${table}"`],
        ['filter =', `SELECT count(*) FROM "${table}" WHERE "category" = 'alpha'`],
        ['group by 1 key', `SELECT count(*) FROM (SELECT "category", sum("count") FROM "${table}" GROUP BY 1)`],
        ['distinct *', `SELECT count(*) FROM (SELECT DISTINCT * FROM "${table}")`],
        ['sort + limit 1k', `SELECT sum(length("category")) FROM (SELECT * FROM "${table}" ORDER BY "category", "count" DESC LIMIT 1000)`],
        ['self join on _key', `SELECT count(*) FROM "${table}" a JOIN "${table}" b ON a."_key" = b."_key"`],
        ['row -> json', `SELECT sum(length(to_json(t))) FROM "${table}" t`],
    ];
}

async function timeOp(frame, sql) {
    await frame.query(sql); // warm
    let best = Infinity;
    let udfCalls = 0;
    for (let n = 0; n < RUNS; n++) {
        calls = 0;
        const start = performance.now();
        await frame.query(sql);
        best = Math.min(best, performance.now() - start);
        udfCalls = calls;
    }
    return { ms: best, udfCalls };
}

/** Compression actually chosen, per column, and how many segments carry it. */
async function compression(frame, table) {
    const rows = await frame.query(
        `SELECT compression, count(*) AS segments FROM pragma_storage_info('${table}')
         GROUP BY 1 ORDER BY 2 DESC`
    );
    return rows.map(([name, segments]) => `${name}:${segments}`).join(' ');
}

async function memoryMB(frame) {
    const rows = await frame.query('SELECT sum(memory_usage_bytes) FROM duckdb_memory()');
    return Number(rows[0][0] ?? 0) / 1024 ** 2;
}

async function scenario(label, options) {
    log(`\n${'='.repeat(92)}\n${label}\n${'='.repeat(92)}`);

    const frame = await DuckFrame.create(CONFIG, { name: 'master', ...options });
    countingUdf(options.database);

    const ingestStart = performance.now();
    await frame.append({ parquet: payloads });
    const ingestMs = performance.now() - ingestStart;
    const table = frame.table;
    log(`  ingest: ${PAYLOADS} payloads in one append, ${ingestMs.toFixed(0)} ms`
        + `  |  rows: ${(await frame.size()).toLocaleString()}`);

    const before = new Map();
    for (const [name, sql] of suite(table)) before.set(name, await timeOp(frame, sql));
    log(`  before: compression [${await compression(frame, table)}]`
        + `  duckdb memory ${(await memoryMB(frame)).toFixed(0)} MB`
        + `  rss ${(process.memoryUsage().rss / 1024 ** 2).toFixed(0)} MB`);

    let checkpointMs = null;
    let checkpointError = null;
    try {
        const start = performance.now();
        await frame.query('CHECKPOINT');
        checkpointMs = performance.now() - start;
    } catch (err) {
        checkpointError = err.message.split('\n')[0];
    }
    log(`  CHECKPOINT: ${checkpointError ? `FAILED - ${checkpointError}` : `${checkpointMs.toFixed(0)} ms`}`);

    const after = new Map();
    for (const [name, sql] of suite(table)) after.set(name, await timeOp(frame, sql));
    log(`  after:  compression [${await compression(frame, table)}]`
        + `  duckdb memory ${(await memoryMB(frame)).toFixed(0)} MB`
        + `  rss ${(process.memoryUsage().rss / 1024 ** 2).toFixed(0)} MB`);

    log(`\n  ${'operation'.padEnd(22)}${'before'.padStart(10)}${'after'.padStart(10)}`
        + `${'change'.padStart(10)}${'udf calls before'.padStart(19)}${'after'.padStart(12)}`);
    for (const [name] of suite(table)) {
        const b = before.get(name);
        const a = after.get(name);
        const change = b.ms / a.ms;
        log(`  ${name.padEnd(22)}${`${b.ms.toFixed(0)} ms`.padStart(10)}${`${a.ms.toFixed(0)} ms`.padStart(10)}`
            + `${`${change >= 1 ? `${change.toFixed(1)}x` : `${(1 / change).toFixed(1)}x slower`}`.padStart(10)}`
            + `${(b.udfCalls || 0).toLocaleString().padStart(19)}${(a.udfCalls || 0).toLocaleString().padStart(12)}`);
    }

    // ------------------------------------------------ does a LATER append lose the win?
    const extra = await timeOp(frame, `SELECT sum(length(udf_upper("category"))) FROM "${table}"`);
    await frame.append({ parquet: payloads[0] });
    const mixed = await timeOp(frame, `SELECT sum(length(udf_upper("category"))) FROM "${table}"`);
    log(`\n  after checkpoint:        ${extra.ms.toFixed(0)} ms, ${extra.udfCalls.toLocaleString()} udf calls`);
    log(`  + 1 more payload (${perPayload.toLocaleString()} rows): ${mixed.ms.toFixed(0)} ms,`
        + ` ${mixed.udfCalls.toLocaleString()} udf calls`
        + `  <- ${mixed.udfCalls > extra.udfCalls + perPayload * 0.5 ? 'the new rows are UNCOMPRESSED' : 'still compressed'}`);

    const reMs = await (async () => {
        const start = performance.now();
        await frame.query('CHECKPOINT');
        return performance.now() - start;
    })().catch(() => null);
    const healed = await timeOp(frame, `SELECT sum(length(udf_upper("category"))) FROM "${table}"`);
    log(`  re-CHECKPOINT (${reMs == null ? 'failed' : `${reMs.toFixed(0)} ms`}): ${healed.ms.toFixed(0)} ms,`
        + ` ${healed.udfCalls.toLocaleString()} udf calls`);

    await frame.destroy();
    await closeDuckDatabase(options.database);
}

await scenario('A. in-memory master table (what the worker builds today)', {});
await scenario('B. file-backed master table', { database: path.join(scratch, 'master.duckdb') });

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(0);
