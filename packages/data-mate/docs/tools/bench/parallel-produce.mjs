/**
 * Can the PRODUCER leg go wider? `fromRecords` on N worker threads instead of one.
 *
 * The ingest breakdown put `coerceToType` at 42-58% of `fromRecords`, and every bit of that is
 * single-threaded JavaScript: one CPU, however many cores the api-server has. DuckDB's own
 * parallelism cannot help, because the cost is on the JS side of the binding before DuckDB sees a
 * value. The api-server already produces ONE Parquet payload per fetch, so the shape is already
 * shardable - this measures whether spreading those shards across worker threads converts idle
 * cores into producer throughput.
 *
 * **Generation is never timed.** Each worker builds its own slice from the seeded generator (a
 * different seed per shard, so no 1M-object array crosses a thread boundary), reports ready, and
 * only then does the parent start the clock and broadcast `go`. What is timed is exactly
 * `coerceToType` + typed appender + `COPY ... (FORMAT parquet)`.
 *
 * The worker tier is measured too, because it is the other half of the trade: N shards land as ONE
 * `append({ parquet: [...] })`, which is the form `read_parquet` reads as a single relation.
 *
 *     node packages/data-mate/docs/tools/bench/parallel-produce.mjs
 *     ROWS=1000000 SHARDS=1,2,4,8 node .../parallel-produce.mjs
*/
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const generate = new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href;

// ------------------------------------------------------------------ the worker
if (!isMainThread) {
    const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
    const { CONFIG, makeRecords } = await import(generate);

    const { rows, seed, file } = workerData;
    // untimed: the api-server gets these from Elasticsearch, it does not build them
    const records = makeRecords(rows, seed);

    parentPort.postMessage({ ready: true });
    await new Promise((resolve) => parentPort.once('message', resolve));

    const start = performance.now();
    const frame = await DuckFrame.fromRecords(CONFIG, records, { name: `shard${seed}` });
    await frame.writeParquet(file);
    const ms = performance.now() - start;

    await frame.destroy();
    await closeDuckDatabase();
    parentPort.postMessage({ ms, rows: records.length });
    process.exit(0);
}

// ------------------------------------------------------------------ the parent
const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { CONFIG } = await import(generate);
const { heading } = await import('../lib/duck.mjs');

const ROWS = Number(process.env.ROWS || 1_000_000);
const SHARD_COUNTS = (process.env.SHARDS || `1,2,4,${Math.min(8, os.cpus().length)}`)
    .split(',').map(Number);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-parallel-'));

heading(`Producer leg on N threads - ${ROWS.toLocaleString()} rows total, ${os.cpus().length} cores`);

/** Runs one shard in its own thread, and resolves once it has written its payload. */
function runShard({ rows, seed, file }) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), {
            workerData: { rows, seed, file },
            resourceLimits: { maxOldGenerationSizeMb: 8192 },
        });

        let ready;
        worker.on('message', (message) => {
            if (message.ready) {
                ready = true;
                resolve({ go: () => worker.postMessage('go'), done: waitForDone(worker) });
            }
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (!ready) reject(new Error(`shard ${seed} exited ${code} before it was ready`));
        });
    });
}

function waitForDone(worker) {
    return new Promise((resolve, reject) => {
        worker.on('message', (message) => {
            if (message.ms != null) resolve(message);
        });
        worker.on('error', reject);
    });
}

const log = (text) => {
    // eslint-disable-next-line no-console
    console.log(text);
};

log(`  ${'shards'.padEnd(8)}${'producer'.padStart(11)}${'rows/s'.padStart(14)}`
    + `${'slowest shard'.padStart(15)}${'worker append'.padStart(15)}`);

for (const shards of SHARD_COUNTS) {
    const per = Math.floor(ROWS / shards);
    const files = [];
    const handles = [];

    for (let n = 0; n < shards; n++) {
        const file = path.join(scratch, `shard-${shards}-${n}.parquet`);
        files.push(file);
        // a different seed per shard: distinct data, and nothing is copied between threads
        handles.push(await runShard({ rows: per, seed: n + 1, file }));
    }

    // every thread has its records in hand; NOW start the clock
    const start = performance.now();
    for (const handle of handles) handle.go();
    const finished = await Promise.all(handles.map((handle) => handle.done));
    const wall = performance.now() - start;

    // the worker tier: all N payloads in ONE append, the form read_parquet takes as one relation
    const table = await DuckFrame.create(CONFIG, { name: `assembled${shards}` });
    const appendStart = performance.now();
    await table.append({ parquet: files });
    const appendMs = performance.now() - appendStart;
    const landed = await table.size();
    await table.destroy();

    const slowest = Math.max(...finished.map((f) => f.ms));
    log(`  ${String(shards).padEnd(8)}${`${wall.toFixed(0)} ms`.padStart(11)}`
        + `${Math.round(landed / (wall / 1000)).toLocaleString().padStart(14)}`
        + `${`${slowest.toFixed(0)} ms`.padStart(15)}${`${appendMs.toFixed(0)} ms`.padStart(15)}`
        + `${landed === per * shards ? '' : `  ROWS LOST: ${landed} vs ${per * shards}`}`);

    for (const file of files) fs.rmSync(file, { force: true });
}

fs.rmSync(scratch, { recursive: true, force: true });
await closeDuckDatabase();
