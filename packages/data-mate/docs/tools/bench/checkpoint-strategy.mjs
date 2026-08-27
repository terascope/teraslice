/**
 * WHEN should the master table be checkpointed, and what does each choice cost?
 *
 * `checkpoint-effect.mjs` established what a checkpoint DOES: on an in-memory master table it turns
 * `Uncompressed` into DICT_FSST/BitPacking/ALP/RLE, cuts DuckDB's memory 5.4x, and takes a UDF over a
 * low-cardinality column from 2,000,000 calls to 13,540 (104x). It also showed that payloads appended
 * AFTER a checkpoint arrive uncompressed, and that a file-backed database is compressed all along.
 *
 * So the open question is the STRATEGY, measured end to end - from `create` to "ready to query" -
 * because ingest time, checkpoint time and memory trade against each other:
 *
 *   1. in-memory, no checkpoint          what the worker does today
 *   2. in-memory, ONE checkpoint at end
 *   3. in-memory, checkpoint every 5 payloads
 *   4. file-backed, default settings     auto-checkpoints during ingest
 *   5. file-backed, auto-checkpoint OFF, one at the end
 *
 * Every strategy is also checked to produce IDENTICAL results, because a faster wrong answer is not
 * an answer.
 *
 *     ROWS=5000000 PAYLOADS=20 node packages/data-mate/docs/tools/bench/checkpoint-strategy.mjs
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

const ROWS = Number(process.env.ROWS || 5_000_000);
const PAYLOADS = Number(process.env.PAYLOADS || 20);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-ckpt2-'));
const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

let calls = 0;
const registerCounter = (database) => registerScalarFunction({
    name: 'udf_upper',
    parameter: 'Keyword',
    returns: { type: 'Keyword' },
    fn: (v) => {
        calls++;
        return String(v).toUpperCase();
    },
    database,
});

log(`\nbuilding ${PAYLOADS} payloads, ${ROWS.toLocaleString()} rows total`);
const perPayload = Math.floor(ROWS / PAYLOADS);
const payloads = [];
for (let n = 0; n < PAYLOADS; n++) {
    const producer = await DuckFrame.fromRecords(
        CONFIG, makeRecords(perPayload, n + 1), { name: `p${n}` }
    );
    const file = path.join(scratch, `p-${n}.parquet`);
    await producer.writeParquet(file);
    await producer.destroy();
    payloads.push(file);
}
await closeDuckDatabase();
log('payloads ready\n');

const results = [];

async function strategy({
    label, database, everyN, disableAuto, checkpointAtEnd
}) {
    const options = database ? { database } : {};
    const frame = await DuckFrame.create(CONFIG, { name: 'master', ...options });
    registerCounter(database);
    if (disableAuto) await frame.query("SET checkpoint_threshold = '1TB'");

    const start = performance.now();
    let checkpointMs = 0;
    for (const [n, file] of payloads.entries()) {
        await frame.append({ parquet: file });
        if (everyN && (n + 1) % everyN === 0) {
            const t = performance.now();
            await frame.query('CHECKPOINT');
            checkpointMs += performance.now() - t;
        }
    }
    if (checkpointAtEnd) {
        const t = performance.now();
        await frame.query('CHECKPOINT');
        checkpointMs += performance.now() - t;
    }
    const readyMs = performance.now() - start;
    const table = frame.table;

    // the real transform path: 30 columns projected, one of them through the UDF
    const transform = async () => {
        calls = 0;
        const t = performance.now();
        await frame.query(
            `CREATE OR REPLACE TABLE t_out AS`
            + ` SELECT * REPLACE (udf_upper("category") AS "category") FROM "${table}"`
        );
        const ms = performance.now() - t;
        await frame.query('DROP TABLE t_out');
        return { ms, calls };
    };
    await transform();
    const projected = await transform();

    // and the answer itself, which must not change
    const check = await frame.query(
        `SELECT count(*), sum(length(udf_upper("category"))), count(DISTINCT "category")`
        + ` FROM "${table}"`
    );
    const memory = Number((await frame.query('SELECT sum(memory_usage_bytes) FROM duckdb_memory()'))[0][0] ?? 0);
    const comp = await frame.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}')
         GROUP BY 1 ORDER BY 2 DESC LIMIT 3`
    );

    results.push({
        label,
        readyMs,
        checkpointMs,
        transformMs: projected.ms,
        udfCalls: projected.calls,
        memoryMB: memory / 1024 ** 2,
        rssMB: process.memoryUsage().rss / 1024 ** 2,
        answer: JSON.stringify(check[0]),
        comp: comp.map(([c, n]) => `${c}:${n}`).join(' '),
    });

    log(`  ${label.padEnd(40)} ready ${readyMs.toFixed(0)} ms`
        + ` (checkpoint ${checkpointMs.toFixed(0)} ms) | transform ${projected.ms.toFixed(0)} ms,`
        + ` ${projected.calls.toLocaleString()} udf calls | duckdb mem ${(memory / 1024 ** 2).toFixed(0)} MB`);

    await frame.destroy();
    await closeDuckDatabase(database);
}

await strategy({ label: '1. in-memory, no checkpoint' });
await strategy({ label: '2. in-memory, ONE checkpoint at end', checkpointAtEnd: true });
await strategy({ label: '3. in-memory, checkpoint every 5', everyN: 5 });
await strategy({
    label: '4. file-backed, default (auto-checkpoint)',
    database: path.join(scratch, 'auto.duckdb'),
});
await strategy({
    label: '5. file-backed, auto OFF + one at end',
    database: path.join(scratch, 'manual.duckdb'),
    disableAuto: true,
    checkpointAtEnd: true,
});

log(`\n${'='.repeat(104)}`);
log(`  ${'strategy'.padEnd(40)}${'ready'.padStart(10)}${'transform'.padStart(11)}`
    + `${'udf calls'.padStart(12)}${'duckdb mem'.padStart(12)}${'compression'.padStart(18)}`);
for (const r of results) {
    log(`  ${r.label.padEnd(40)}${`${r.readyMs.toFixed(0)} ms`.padStart(10)}`
        + `${`${r.transformMs.toFixed(0)} ms`.padStart(11)}${r.udfCalls.toLocaleString().padStart(12)}`
        + `${`${r.memoryMB.toFixed(0)} MB`.padStart(12)}${r.comp.split(' ')[0].padStart(18)}`);
}
const answers = new Set(results.map((r) => r.answer));
log(`\n  identical answers across all strategies: ${answers.size === 1 ? 'YES' : `NO - ${[...answers].join(' vs ')}`}`);
log(`  ${results[0].answer}  (count, sum(length(upper(category))), distinct categories)`);

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(0);
