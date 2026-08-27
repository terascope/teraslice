/**
 * ONE BIG FILE vs MANY SLICE PAYLOADS — local disk against real S3.
 *
 * **The gap this fills.** `slice-payloads.mjs` answers the stitching question on local disk.
 * `parquet-remote.mjs` measures S3 but sweeps FILE COUNT from 10 upward and never tries a single
 * merged file. So the specific comparison a worker design turns on — **many small slice payloads
 * against one stitched file, on the storage they will actually live on** — has never been run.
 *
 * It matters more on S3 than locally. Locally a payload's footer is a page-cache hit; on S3 every
 * file is at least one GET for the footer plus one per column chunk range, and those are **per file,
 * per query**. If the per-file request count is what it looked like in `parquet-remote.mjs` (2-5),
 * then 2,000 payloads is 4,000-10,000 requests for a single query, and at a real same-region S3
 * round-trip of 20-100 ms that is not a tax, it is a wall.
 *
 * **The caches are the whole story and every one is OFF by default** — `enable_http_metadata_cache`,
 * `parquet_metadata_cache`, `httpfs_connection_caching`. `parquet-remote.mjs` measured them taking a
 * two-predicate search from 40.7 MB transferred to 5 KB. So this runs each layout BOTH ways: caches
 * off (what a fresh worker gets) and on (what it should be configured with).
 *
 * Endpoint, same as the repo's own tests:
 *
 *     docker run -d --name duck-bench-minio -p 49000:9000 \
 *       -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
 *       minio/minio:RELEASE.2024-08-29T01-40-52Z server /data
 *
 * **Localhost minio has a sub-millisecond round-trip.** It measures protocol, request count and CPU
 * with the network removed. Real S3 adds 20-100 ms per cold GET, so multiply the REQUEST COUNT — which
 * is the number this reports and the one nobody should have to guess — by your own round-trip.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/slice-payloads-s3.mjs
 *   TOTAL=20000000 PER=50000 node .../slice-payloads-s3.mjs
 *
 * Requires the build: `npx tsc -b`, and minio running on port 49000.
 */
import { rm, mkdir, stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const run_ = promisify(execFile);

const TOTAL = Number(process.env.TOTAL || 5_000_000);
const PER = Number(process.env.PER || 50_000);
const REPEATS = Number(process.env.REPEATS || 3);
const SPOOL = process.env.SPOOL || '/tmp/duck-slice-s3';
const BUCKET = process.env.BUCKET || 'duck-slice';
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'localhost:49000';
const S3_KEY = process.env.S3_KEY || 'minioadmin';
const S3_SECRET = process.env.S3_SECRET || 'minioadmin';
const CONTAINER = process.env.CONTAINER || 'duck-bench-minio';
const ROW_GROUP = 122_880;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const QUERIES = [
    ['count(*)', 'SELECT count(*) FROM {T}'],
    ['selective filter', `SELECT count(*) FROM {T} WHERE "active" = true AND "category" = 'gamma'`],
    ['project 1 col', 'SELECT sum("amount") FROM {T}'],
    ['top 100 rows', 'SELECT * FROM {T} WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],
];

/** Caches OFF is what a fresh worker gets; ON is what it should be configured with. */
const PROFILES = {
    'caches off': [],
    'caches on': [
        'SET enable_http_metadata_cache = true',
        'SET parquet_metadata_cache = true',
        'SET httpfs_connection_caching = true',
    ],
};

const sqlList = (paths) => `[${paths.map((p) => `'${p}'`).join(', ')}]`;

async function dirBytes(dir) {
    let total = 0;
    for (const f of await readdir(dir)) total += (await stat(join(dir, f))).size;
    return total;
}

/* ------------------------------------------------------------------ corpus */

await rm(SPOOL, { recursive: true, force: true });
const rawDir = join(SPOOL, 'raw');
const bigDir = join(SPOOL, 'big');
await mkdir(rawDir, { recursive: true });
await mkdir(bigDir, { recursive: true });

heading(`SLICE PAYLOADS ON S3 — ${num(TOTAL)} rows as ${num(PER)}-row slices`);
note(`  a ${num(PER)}-row payload is ${(PER / ROW_GROUP * 100).toFixed(0)}% of one row group`);

const paths = [];
let written = 0;
const genStart = performance.now();
while (written < TOTAL) {
    const take = Math.min(PER, TOTAL - written);
    const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(take, written + 1), { name: `g${paths.length}` });
    const p = join(rawDir, `p${String(paths.length).padStart(6, '0')}.parquet`);
    await frame.writeParquet(p);
    await frame.destroy();
    paths.push(p);
    written += take;
}
note(`  ${num(paths.length)} payloads in ${((performance.now() - genStart) / 1000).toFixed(1)}s,`
    + ` ${mb(await dirBytes(rawDir))}`);

const instance = await DuckDBInstance.create(':memory:');
const local = await instance.connect();
await local.run(`SET checkpoint_threshold = '1TB'`);
const bigPath = join(bigDir, 'all.parquet');
const mergeStart = performance.now();
await local.run(`COPY (SELECT * FROM read_parquet(${sqlList(paths)})) TO '${bigPath}' (FORMAT parquet, COMPRESSION zstd)`);
const mergeMs = performance.now() - mergeStart;
const groups = Number((await (await local.runAndReadAll(
    `SELECT sum(num_row_groups) FROM parquet_file_metadata('${bigPath}')`
)).getRows())[0][0]);
note(`  merged into ONE file in ${(mergeMs / 1000).toFixed(1)}s:`
    + ` ${mb((await stat(bigPath)).size)}, ${num(groups)} row groups`);

/* ------------------------------------------------------------------ upload */

// minio's filesystem backend exposes each top-level dir under /data as a bucket, so the bucket is
// created by making the directory - DuckDB's COPY will not create one
await run_('docker', ['exec', CONTAINER, 'mkdir', '-p', `/data/${BUCKET}/raw`]);
await run_('docker', ['exec', CONTAINER, 'mkdir', '-p', `/data/${BUCKET}/big`]);

async function s3Connection() {
    const c = await instance.connect();
    await c.run('LOAD httpfs');
    await c.run(`CREATE OR REPLACE SECRET bench (
        TYPE S3, KEY_ID '${S3_KEY}', SECRET '${S3_SECRET}',
        ENDPOINT '${S3_ENDPOINT}', URL_STYLE 'path', USE_SSL false
    )`);
    return c;
}

const up = await s3Connection();
const upStart = performance.now();
await up.run(`COPY (SELECT * FROM read_parquet(${sqlList(paths)}))
    TO 's3://${BUCKET}/raw' (FORMAT parquet, COMPRESSION zstd, PARTITION_BY (), OVERWRITE_OR_IGNORE)`)
    .catch(async () => {
        // PARTITION_BY () is not a thing; fall back to uploading each payload individually, which is
        // also what the producer would really do - one PUT per slice as it lands
        for (const [i, p] of paths.entries()) {
            await up.run(`COPY (SELECT * FROM read_parquet('${p}')) TO 's3://${BUCKET}/raw/p${String(i).padStart(6, '0')}.parquet' (FORMAT parquet, COMPRESSION zstd)`);
        }
    });
await up.run(`COPY (SELECT * FROM read_parquet('${bigPath}')) TO 's3://${BUCKET}/big/all.parquet' (FORMAT parquet, COMPRESSION zstd)`);
note(`  uploaded to minio in ${((performance.now() - upStart) / 1000).toFixed(1)}s`);

/* ------------------------------------------------------------------ measure */

async function battery(c, relation) {
    const out = {};
    for (const [name, sql] of QUERIES) {
        const samples = [];
        for (let i = 0; i < REPEATS; i++) {
            const start = performance.now();
            await (await c.runAndReadAll(sql.replace('{T}', relation))).getRows();
            samples.push(performance.now() - start);
        }
        out[name] = median(samples.slice(1).length ? samples.slice(1) : samples);
    }
    return out;
}

const results = [];

// local baseline, both layouts
results.push(['local', 'many payloads', await battery(local, `read_parquet(${sqlList(paths)})`)]);
results.push(['local', 'ONE big file', await battery(local, `read_parquet('${bigPath}')`)]);

for (const [profile, statements] of Object.entries(PROFILES)) {
    for (const [layout, uri] of [
        ['many payloads', `read_parquet('s3://${BUCKET}/raw/*.parquet')`],
        ['ONE big file', `read_parquet('s3://${BUCKET}/big/all.parquet')`],
    ]) {
        const c = await s3Connection();
        for (const s of statements) await c.run(s);
        results.push([`s3 ${profile}`, layout, await battery(c, uri)]);
        c.disconnectSync();
    }
}

heading('RESULTS — warm ms');
console.log(`    ${'origin'.padEnd(16)}${'layout'.padEnd(16)}${QUERIES.map(([n]) => n.padStart(18)).join('')}`);
for (const [origin, layout, q] of results) {
    console.log(`    ${origin.padEnd(16)}${layout.padEnd(16)}`
        + QUERIES.map(([n]) => q[n].toFixed(1).padStart(18)).join(''));
}

heading('ONE FILE vs MANY, PER ORIGIN — how much stitching is worth');
for (const origin of [...new Set(results.map((r) => r[0]))]) {
    const many = results.find((r) => r[0] === origin && r[1] === 'many payloads')[2];
    const one = results.find((r) => r[0] === origin && r[1] === 'ONE big file')[2];
    note(`  ${origin.padEnd(16)}`
        + QUERIES.map(([n]) => `${n}: ${(many[n] / one[n]).toFixed(1)}x`).join('  ·  '));
}

local.disconnectSync();
up.disconnectSync();
instance.closeSync();
await run_('docker', ['exec', CONTAINER, 'rm', '-rf', `/data/${BUCKET}`]).catch(() => {});
await rm(SPOOL, { recursive: true, force: true });
await closeDuckDatabase();
process.exit(0);
