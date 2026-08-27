/**
 * POINT 5 — LOCAL DISK vs S3, with the round trip PUT BACK IN.
 *
 * Written for the boss-facing report (2026-08-25). It closes the one term the storage decision
 * rests on and that nothing here has ever measured.
 *
 * **The hole this fills.** Every remote number recorded so far is localhost minio - a
 * sub-millisecond round trip. That isolates protocol and CPU cost, which is a real finding, but it
 * silently sets the term that dominates real S3 to ZERO. Parquet issues 2-5 requests per file per
 * query; at 20-100 ms per cold GET and hundreds of objects, latency is seconds per query and every
 * recorded break-even collapses in consolidation's favour. The docs correctly call this
 * **UNDETERMINED**. This run models it: the same minio, behind a proxy that injects a known delay.
 *
 * **Read every number here as "modelled at N ms RTT", never as "measured on S3".** The model has a
 * fixed delay where real S3 has a distribution, and no TLS, rate limiting or cross-AZ effects.
 * What it does capture is the thing that matters: **request COUNT multiplied by round trip**, which
 * is what makes object count the dominant variable remotely.
 *
 * **The axes:**
 *
 *   layout   many payloads (jagged 10k-100k)  |  consolidated ~2M rows  |  ONE object
 *   caches   off (as shipped)  |  on (metadata + parquet metadata + connection caching)
 *   RTT      0 / 20 / 50 / 100 ms per request
 *
 * `enable_http_metadata_cache`, `parquet_metadata_cache` and `httpfs_connection_caching` are all
 * **OFF by default**, and turning them on took a two-predicate search from transferring 40.7 MB to
 * 5 KB. That is the highest-value configuration decision for remote payloads, so it is an axis
 * rather than an assumption.
 *
 * Requires minio. Started automatically if absent, using the same image and credentials
 * `ts-scripts` uses.
 *
 * Run (serially - never two DuckDB benches at once):
 *   node packages/data-mate/docs/tools/bench/report-s3.mjs
 *   ROWS=5000000 RTTS=0,20 node .../report-s3.mjs
 */
import { rm, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';
import { startProxy } from '../lib/latency-proxy.mjs';

const run = promisify(execFile);

const ROWS = Number(process.env.ROWS || 5_000_000);
const RTTS = (process.env.RTTS || '0,20,50,100').split(',').map(Number);
const REPEATS = Number(process.env.REPEATS || 3);
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '24GiB';
const ROOT = process.env.ROOT || '/tmp/duck-s3';
const BUCKET = process.env.BUCKET || 'duck-report';
const MINIO_PORT = Number(process.env.MINIO_PORT || 49000);
const MINIO_NAME = process.env.MINIO_NAME || 'duck-report-minio';
const IMAGE = 'minio/minio:RELEASE.2024-08-29T01-40-52Z';
const KEY = 'minioadmin';
const OUT = process.env.OUT || new URL('../results/s3.json', import.meta.url).pathname;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A subset of the shared battery: four RTTs x three layouts x two cache profiles is 24 cells. */
const QUERIES = [
    ['count(*) [metadata only]', 'SELECT count(*) FROM t'],
    ['search: 2 predicates', `SELECT count(*) FROM t WHERE "active" = true AND "category" = 'gamma'`],
    ['search: range + eq', `SELECT count(*) FROM t WHERE "amount" BETWEEN 100 AND 5000 AND "status" = 'active'`],
    ['search: IN list', `SELECT count(*) FROM t WHERE "category" IN ('alpha','gamma')`],
    ['search: top 100 rows', 'SELECT * FROM t WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],
    ['agg: 1 key + 3 aggs', 'SELECT "category", count(*), sum("amount"), avg("score") FROM t GROUP BY 1'],
    ['agg: high-card group', 'SELECT "name", count(*) FROM t GROUP BY 1'],
    ['project 1 col', 'SELECT sum("amount") FROM t'],
];

/* ------------------------------------------------------------------ minio */

async function ensureMinio() {
    try {
        const { stdout } = await run('docker', ['ps', '--filter', `name=${MINIO_NAME}`, '--format', '{{.Names}}']);
        if (stdout.trim() === MINIO_NAME) {
            note(`minio already running as ${MINIO_NAME}`);
            return;
        }
    } catch { /* docker may not be up; the run below will report it */ }

    await run('docker', ['rm', '-f', MINIO_NAME]).catch(() => {});
    await run('docker', [
        'run', '-d', '--name', MINIO_NAME,
        '-p', `${MINIO_PORT}:9000`,
        '-e', `MINIO_ROOT_USER=${KEY}`,
        '-e', `MINIO_ROOT_PASSWORD=${KEY}`,
        IMAGE, 'server', '/data',
    ]);
    note(`started minio (${IMAGE}) on :${MINIO_PORT}`);
    for (let i = 0; i < 40; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${MINIO_PORT}/minio/health/live`);
            if (res.ok) return;
        } catch { /* not up yet */ }
        await sleep(500);
    }
    throw new Error('minio did not become healthy');
}

/**
 * Create the bucket. DuckDB's `COPY ... TO 's3://...'` does NOT create one - it fails with
 * `NoSuchBucket` - and this build has no `mc` to call. Single-drive minio stores each bucket as a
 * top-level directory under /data, so creating the directory creates the bucket. Verified by
 * round-tripping a probe object before the real corpus is uploaded.
 */
async function ensureBucket() {
    await run('docker', ['exec', MINIO_NAME, 'mkdir', '-p', `/data/${BUCKET}`]);
    // start every run from an empty bucket, or a previous layout's objects join this one's glob
    await run('docker', ['exec', MINIO_NAME, 'sh', '-c',
        `rm -rf /data/${BUCKET}/* 2>/dev/null || true`]).catch(() => {});
    note(`bucket ${BUCKET} ready (empty)`);
}

/** Point a connection at an endpoint, with the cache profile applied. */
async function configureS3(connection, endpointPort, caches) {
    await connection.run('LOAD httpfs');
    await connection.run(`SET s3_endpoint = '127.0.0.1:${endpointPort}'`);
    await connection.run("SET s3_use_ssl = false");
    await connection.run("SET s3_url_style = 'path'");
    await connection.run(`SET s3_access_key_id = '${KEY}'`);
    await connection.run(`SET s3_secret_access_key = '${KEY}'`);
    await connection.run("SET s3_region = 'us-east-1'");
    // all three are OFF as shipped - that is the finding, so it is an axis
    await connection.run(`SET enable_http_metadata_cache = ${caches}`);
    await connection.run(`SET parquet_metadata_cache = ${caches}`);
    await connection.run(`SET httpfs_connection_caching = ${caches}`);
}

/* ------------------------------------------------------------------ corpus */

async function produce(dir, rows, sizeFor) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const db = `${dir}.gen.db`;
    for (const p of [db, `${db}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    let made = 0; let n = 0;
    while (made < rows) {
        const take = Math.min(sizeFor(n), rows - made);
        const frame = await DuckFrame.create(CONFIG, { name: `p${n}`, database: db });
        await frame.append({ records: makeRecords(take, made + 1) });
        await frame.writeParquet(join(dir, `part-${String(n).padStart(5, '0')}.parquet`));
        await frame.destroy();
        made += take; n += 1;
    }
    await closeDuckDatabase(db);
    for (const p of [db, `${db}.wal`]) if (existsSync(p)) await rm(p, { force: true });
    return n;
}

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

/* ------------------------------------------------------------------ run */

heading(`POINT 5 — LOCAL vs S3 at ${num(ROWS)} rows, RTT modelled at ${RTTS.join('/')} ms`);
note('MODELLED latency in front of localhost minio - not a measurement of real S3');

await ensureMinio();
await ensureBucket();
await mkdir(ROOT, { recursive: true });

/* ---- build the three layouts locally ---- */

const jaggedDir = join(ROOT, 'jagged');
const jaggedFiles = await produce(jaggedDir, ROWS, (n) => 10_000 + ((n * 37_889) % 91_000));
note(`jagged payloads: ${jaggedFiles} files`);

const consolidatedDir = join(ROOT, 'consolidated');
const oneDir = join(ROOT, 'one');
await mkdir(consolidatedDir, { recursive: true });
await mkdir(oneDir, { recursive: true });

{
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    const glob = join(jaggedDir, '*.parquet');
    // consolidate to ~2M rows per object: measured 3x cheaper to build than targeting one row
    // group, because the cost is per COPY STATEMENT and not per row
    const target = 2_000_000;
    const batches = Math.ceil(ROWS / target);
    for (let i = 0; i < batches; i++) {
        await connection.run(
            `COPY (SELECT * FROM read_parquet('${glob}') LIMIT ${target} OFFSET ${i * target})`
            + ` TO '${join(consolidatedDir, `part-${i}.parquet`)}' (FORMAT parquet, COMPRESSION zstd)`
        );
    }
    await connection.run(
        `COPY (SELECT * FROM read_parquet('${glob}')) TO '${join(oneDir, 'all.parquet')}'`
        + ' (FORMAT parquet, COMPRESSION zstd)'
    );
    connection.disconnectSync();
    instance.closeSync();
    note(`consolidated: ${batches} objects of ~${num(target)} rows; plus ONE object`);
}

const LAYOUTS = [
    ['many payloads', jaggedDir],
    ['consolidated ~2M', consolidatedDir],
    ['ONE object', oneDir],
];

/* ---- upload each layout ---- */

{
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    await configureS3(connection, MINIO_PORT, 'true');
    await connection.run(`CREATE OR REPLACE SECRET s (TYPE s3, KEY_ID '${KEY}', SECRET '${KEY}',`
        + ` ENDPOINT '127.0.0.1:${MINIO_PORT}', USE_SSL false, URL_STYLE 'path', REGION 'us-east-1')`);
    for (const [label, dir] of LAYOUTS) {
        const prefix = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const files = (await readdir(dir)).filter((f) => f.endsWith('.parquet'));
        const start = performance.now();
        for (const f of files) {
            await connection.run(
                `COPY (SELECT * FROM read_parquet('${join(dir, f)}'))`
                + ` TO 's3://${BUCKET}/${prefix}/${f}' (FORMAT parquet, COMPRESSION zstd)`
            );
        }
        let bytes = 0;
        for (const f of files) bytes += (await stat(join(dir, f))).size;
        note(`uploaded ${label.padEnd(18)} ${String(files.length).padStart(4)} objects`
            + ` ${mb(bytes).padStart(10)} in ${((performance.now() - start) / 1000).toFixed(1)}s`);
    }
    connection.disconnectSync();
    instance.closeSync();
}

/* ---- local baseline ---- */

const results = [];

for (const [label, dir] of LAYOUTS) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
    await connection.run(
        `CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${join(dir, '*.parquet')}')`
    );
    const queries = await timeQueries(connection, REPEATS);
    connection.disconnectSync();
    instance.closeSync();
    results.push({ origin: 'local disk', rtt: 0, caches: 'n/a', layout: label, queries, requests: 0 });
}

/* ---- s3, per RTT and cache profile ---- */

for (const rtt of RTTS) {
    const proxy = await startProxy({ targetPort: MINIO_PORT, delayMs: rtt });
    for (const caches of ['false', 'true']) {
        for (const [label] of LAYOUTS) {
            const prefix = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
            const instance = await DuckDBInstance.create(':memory:');
            const connection = await instance.connect();
            await connection.run(`SET memory_limit = '${MEMORY_LIMIT}'`);
            await configureS3(connection, proxy.port, caches);
            proxy.reset();
            let queries = null; let failure = null;
            try {
                await connection.run('CREATE OR REPLACE VIEW t AS SELECT * FROM'
                    + ` read_parquet('s3://${BUCKET}/${prefix}/*.parquet')`);
                queries = await timeQueries(connection, REPEATS);
            } catch (err) {
                failure = String(err.message || err).split('\n')[0];
            }
            const stats = proxy.stats();
            connection.disconnectSync();
            instance.closeSync();
            results.push({
                origin: 's3 (modelled)', rtt, caches: caches === 'true' ? 'on' : 'off',
                layout: label, queries, failure, requests: stats.requests, bytesOut: stats.bytesOut,
            });
            const shown = failure
                ? `FAILED ${failure}`
                : QUERIES.map(([n]) => queries[n].warm.toFixed(0).padStart(9)).join('');
            console.log(`    rtt=${String(rtt).padStart(3)}ms caches=${caches === 'true' ? 'on ' : 'off'}`
                + ` ${label.padEnd(18)}${shown}`);
        }
    }
    await proxy.close();
}

/* ---- summary ---- */

heading('WARM MS PER QUERY');
console.log(`    ${'origin'.padEnd(16)}${'rtt'.padStart(6)}${'caches'.padStart(8)}${'layout'.padEnd(20)}`
    + QUERIES.map(([n]) => n.slice(0, 8).padStart(9)).join('') + '  reqs');
for (const r of results) {
    if (!r.queries) {
        console.log(`    ${r.origin.padEnd(16)}${String(r.rtt).padStart(6)}${r.caches.padStart(8)}`
            + `  ${r.layout.padEnd(20)}FAILED ${r.failure}`);
        continue;
    }
    console.log(`    ${r.origin.padEnd(16)}${String(r.rtt).padStart(6)}${r.caches.padStart(8)}`
        + `  ${r.layout.padEnd(18)}`
        + QUERIES.map(([n]) => r.queries[n].warm.toFixed(0).padStart(9)).join('')
        + `  ${r.requests}`);
}

heading('THE TERM THAT DOMINATES — object count x requests x round trip');
note('  layout               objects   requests/query   modelled cost at 20/50/100 ms');
for (const [label, dir] of LAYOUTS) {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.parquet')).length;
    const sample = results.find((r) => r.layout === label && r.rtt === RTTS.at(-1) && r.caches === 'on');
    const perQuery = sample ? sample.requests / (QUERIES.length * REPEATS) : 0;
    note(`  ${label.padEnd(20)}${String(files).padStart(8)}${perQuery.toFixed(1).padStart(16)}`
        + `   ${[20, 50, 100].map((ms) => `${((perQuery * ms) / 1000).toFixed(2)}s`).join(' / ')}`);
}
note('  (requests/query is TOTAL proxy requests / queries run, so it includes the cold one)');

await writeFile(OUT, JSON.stringify({
    rows: ROWS, rtts: RTTS, queries: QUERIES.map(([n]) => n), results,
}, null, 2));
note(`  results -> ${OUT}`);

await rm(ROOT, { recursive: true, force: true });
process.exit(0);
