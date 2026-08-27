/**
 * Does a JS UDF parallelise across Node WORKER THREADS, each with its own DuckDB instance?
 *
 * A registered UDF is strictly single-threaded because one V8 isolate is one thread
 * (`tools/bench/udf-threads.mjs`). Worker threads are separate isolates, so the question is whether
 * N of them over N partitions of the SAME table recover the parallelism - and what that costs.
 *
 * **The constraint that shapes it:** native handles do not cross isolates, so each worker needs its
 * OWN `DuckDBInstance`, and two instances cannot share an in-memory database. The table therefore has
 * to be a FILE, opened read-only by each worker. Partitioning is by `rowid` range.
 *
 *     node packages/data-mate/docs/tools/bench/udf-isolates.mjs
 *     ROWS=5000000 WORKERS=1,2,4,8 node .../udf-isolates.mjs
*/
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const generate = new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href;

if (!isMainThread) {
    const {
        database, table, lo, hi, expression
    } = workerData;
    let instance;
    try {
        const { DuckDBInstance } = await import(pathToFileURL(require.resolve('@duckdb/node-api')).href);
        // its own instance, read-only: several instances may read one file, only one may write it
        instance = await DuckDBInstance.create(database, { access_mode: 'read_only', threads: '1' });
        const connection = await instance.connect();
        const { createScalarFunction } = await import(dist('duck-frame/scalar-function.js'));
        connection.registerScalarFunction(createScalarFunction({
            name: 'udf_upper',
            parameter: 'Keyword',
            returns: { type: 'Keyword' },
            fn: (v) => String(v).toUpperCase(),
        }));

        parentPort.postMessage({ ready: true });
        await new Promise((resolve) => parentPort.once('message', resolve));

        const start = performance.now();
        const result = await connection.run(
            `SELECT sum(length(${expression})) AS total FROM "${table}"`
            + ` WHERE rowid >= ${lo} AND rowid < ${hi}`
        );
        await result.getRowsJson();
        parentPort.postMessage({ ms: performance.now() - start });
    } catch (err) {
        parentPort.postMessage({ error: `${err.name}: ${err.message}` });
    } finally {
        // a worker that registered a UDF does not exit without this
        instance?.closeSync();
    }
    process.exit(0);
}

const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { CONFIG, makeRecords } = await import(generate);

const ROWS = Number(process.env.ROWS || 2_000_000);
const WORKER_COUNTS = (process.env.WORKERS || '1,2,4,8').split(',').map(Number);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-isolates-'));
const database = path.join(scratch, 'corpus.duckdb');

const log = (text) => {
    // eslint-disable-next-line no-console
    console.log(text);
};

log(`\n=== UDF across isolates - ${ROWS.toLocaleString()} rows, ${os.cpus().length} cores\n`);

// build the file-backed table once, then release it so the workers can open it read-only
const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'corpus', database });
await frame.query('CHECKPOINT');
const TABLE = frame.table;
log(`  built ${database} (table "${TABLE}")`);
// the writer must be GONE before the readers open it: one read-write handle excludes the rest
await closeDuckDatabase(database);

function spawn({
    table, lo, hi, expression
}) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), {
            workerData: {
                database, table, lo, hi, expression
            },
        });
        let ready = false;
        const done = new Promise((res) => worker.on('message', (m) => {
            if (m.ms != null) res(m.ms);
        }));
        worker.on('message', (m) => {
            if (m.ready && !ready) {
                ready = true;
                resolve({ go: () => worker.postMessage('go'), done });
            }
        });
        worker.on('message', (m) => {
            if (m.error) reject(new Error(`worker: ${m.error}`));
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (!ready) reject(new Error(`worker exited ${code} before ready`));
        });
    });
}

log(`  ${'workers'.padEnd(9)}${'udf wall'.padStart(11)}${'speedup'.padStart(10)}`
    + `${'cores'.padStart(8)}${'slowest'.padStart(10)}`);

let base = null;
for (const workers of WORKER_COUNTS) {
    const per = Math.ceil(ROWS / workers);
    const handles = [];
    for (let n = 0; n < workers; n++) {
        handles.push(await spawn({
            table: TABLE, lo: n * per, hi: (n + 1) * per, expression: 'udf_upper("category")',
        }));
    }

    const cpuStart = process.cpuUsage();
    const start = performance.now();
    for (const handle of handles) handle.go();
    const times = await Promise.all(handles.map((handle) => handle.done));
    const wall = performance.now() - start;
    const used = process.cpuUsage(cpuStart);

    base ??= wall;
    log(`  ${String(workers).padEnd(9)}${`${wall.toFixed(0)} ms`.padStart(11)}`
        + `${`${(base / wall).toFixed(2)}x`.padStart(10)}`
        + `${(((used.user + used.system) / 1000) / wall).toFixed(1).padStart(8)}`
        + `${`${Math.max(...times).toFixed(0)} ms`.padStart(10)}`);
}

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(0);
