/**
 * What changes when the Parquet payloads are NOT on local disk.
 *
 * **Two origins, because they answer different halves.**
 *
 * `minio` is a REAL S3 endpoint - the same image, version and credentials `ts-scripts` uses for the
 * repo's own tests (`MINIO_PORT=49000`, `minioadmin`) - so the S3 protocol, signing and object
 * semantics are exercised for real, on localhost.
 *
 * `http` is a plain local origin that COUNTS every request and byte, which minio cannot be made to
 * report as cheaply. It has the same request pattern and none of the latency, so it supplies the
 * multiplier:
 *
 *     S3 cost per query  ~=  (requests per file) x (file count) x (S3 round-trip) + transfer
 *
 * and the term nobody knows is **requests per file**. Localhost minio has a sub-millisecond
 * round-trip, so it measures protocol and CPU cost with the network removed; real same-region S3 adds
 * 20-100 ms per cold GET. Multiply the request count by your own round-trip - the arithmetic is
 * yours, and the point of measuring the count is that you no longer have to guess at it.
 *
 * Start the endpoint the way the repo does:
 *
 *     docker run -d --name duck-bench-minio -p 49000:9000 \
 *       -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
 *       minio/minio:RELEASE.2024-08-29T01-40-52Z server /data
 *
 * The second thing it measures is whether DuckDB's Parquet reader is smart over HTTP: a reader that
 * pulls only the footer and the column chunks it needs issues few requests and transfers little,
 * while one that pulls whole files makes remote Parquet unusable at any file count.
 *
 * Run (after `parquet-query.mjs` has been read for the local baseline):
 *   node packages/data-mate/docs/tools/bench/parquet-remote.mjs
 *   SCALE=5000000 FILES=10,100,1000 node .../parquet-remote.mjs
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { rm, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const SCALE = Number(process.env.SCALE || 1_000_000);
const FILES = (process.env.FILES || '10,100,1000').split(',').map(Number);
const GEN_CHUNK = Number(process.env.GEN_CHUNK || 100_000);
const REPEATS = Number(process.env.REPEATS || 3);
const SPOOL = process.env.SPOOL || '/tmp/duck-remote-spool';
/**
 * Which origins to measure. `http` is the request COUNTER, and a Node server cannot absorb the
 * connection burst a 1,000-file query produces - it fails at view creation with
 * "Failure when receiving data from the peer", which is a fact about this bench's origin and not
 * about DuckDB. The request-per-file count is constant across file counts anyway, so measure it at
 * 10 and 100 files and drop it above that: `ORIGINS=local,s3`.
*/
const ORIGINS = (process.env.ORIGINS || 'local,http,s3').split(',');

/**
 * The `httpfs` and Parquet-reader settings, as a measured axis.
 *
 * **Every one of these is OFF by default**, which is why the first run of this bench found that a
 * one-column query still transferred the whole corpus and that each file cost 2-5 requests PER
 * QUERY. A footer re-read on every query is exactly what a metadata cache exists to prevent, so the
 * default numbers may be measuring the absence of caching rather than a property of remote Parquet.
 *
 * | setting | default | what it should change |
 * |---|---|---|
 * | `enable_http_metadata_cache` | false | caches HTTP HEAD results - the file-size probe per query |
 * | `parquet_metadata_cache` | false | caches the parsed Parquet FOOTER, the per-file tax itself |
 * | `httpfs_connection_caching` | false | reuses sockets - and may be what saturated minio |
 * | `prefetch_all_parquet_files` | false | fetches whole files up front instead of ranges |
 *
 * `disable_parquet_prefetching` is left alone: it is already false, meaning prefetching is ON.
*/
const PROFILES = {
    default: [],
    'metadata-cache': [
        'SET enable_http_metadata_cache = true',
        'SET parquet_metadata_cache = true',
    ],
    'conn-cache': ['SET httpfs_connection_caching = true'],
    'cache-all': [
        'SET enable_http_metadata_cache = true',
        'SET parquet_metadata_cache = true',
        'SET httpfs_connection_caching = true',
    ],
    'prefetch-all': [
        'SET enable_http_metadata_cache = true',
        'SET parquet_metadata_cache = true',
        'SET httpfs_connection_caching = true',
        'SET prefetch_all_parquet_files = true',
    ],
};
const TUNINGS = (process.env.TUNINGS || 'default,metadata-cache,cache-all,prefetch-all').split(',');
const S3_ENDPOINT = process.env.MINIO_HOST || '127.0.0.1:49000';
const S3_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const S3_SECRET = process.env.MINIO_SECRET_KEY || 'minioadmin';
const BUCKET = process.env.S3_BUCKET || 'duck-bench';

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

/* ------------------------------------------------------------------ an origin that counts */

/**
 * Serves the spool over HTTP with byte-range support, and counts every request and byte.
 *
 * Range support is not optional: without it DuckDB cannot fetch a footer without fetching the whole
 * file, and the measurement would say remote Parquet is hopeless when what is hopeless is the
 * server. S3 supports ranges, so the origin must too for the comparison to mean anything.
*/
function origin(dir) {
    const stats = { requests: 0, ranged: 0, bytes: 0, byFile: new Map() };
    const server = createServer({ keepAlive: true, keepAliveTimeout: 60_000 }, (req, res) => {
        const path = join(dir, decodeURIComponent(req.url.split('?')[0]));
        if (!existsSync(path) || !statSync(path).isFile()) {
            res.writeHead(404).end();
            return;
        }
        stats.requests++;
        const name = basename(path);
        stats.byFile.set(name, (stats.byFile.get(name) ?? 0) + 1);

        const size = statSync(path).size;
        const range = req.headers.range;
        if (range) {
            stats.ranged++;
            const [from, to] = range.replace('bytes=', '').split('-');
            const start = Number(from);
            const end = to ? Number(to) : size - 1;
            stats.bytes += end - start + 1;
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(end - start + 1),
            });
            if (req.method === 'HEAD') { res.end(); return; }
            createReadStream(path, { start, end }).pipe(res);
            return;
        }
        stats.bytes += size;
        res.writeHead(200, { 'Accept-Ranges': 'bytes', 'Content-Length': String(size) });
        if (req.method === 'HEAD') { res.end(); return; }
        createReadStream(path).pipe(res);
    });
    return { server, stats };
}

/* ------------------------------------------------------------------ corpus */

async function generate(scale, count, dir) {
    await mkdir(dir, { recursive: true });
    const perFile = Math.ceil(scale / count);
    const paths = [];
    let written = 0;
    let seed = 1;
    while (written < scale) {
        const take = Math.min(perFile, scale - written);
        const pieces = [];
        for (let done = 0; done < take; done += GEN_CHUNK) {
            pieces.push(...makeRecords(Math.min(GEN_CHUNK, take - done), seed++));
        }
        const frame = await DuckFrame.fromRecords(CONFIG, pieces, { name: `rgen_${paths.length}` });
        const path = join(dir, `p${String(paths.length).padStart(5, '0')}.parquet`);
        await frame.writeParquet(path);
        await frame.destroy();
        paths.push(path);
        written += take;
    }
    return paths;
}

/* ------------------------------------------------------------------ battery */

/**
 * Deliberately spans the range that matters remotely: a metadata-only query, a query that needs ONE
 * column, and one that needs every column. If the reader pushes projection down, the three should
 * transfer wildly different amounts - and if it does not, remote Parquet costs a full download per
 * query whatever you ask for.
*/
const QUERIES = [
    ['count(*) [metadata only]', 'SELECT count(*) FROM t'],
    ['agg: 1 key + 3 aggs', 'SELECT "category", count(*), sum("amount"), avg("score") FROM t GROUP BY 1'],
    ['search: 2 predicates', `SELECT count(*) FROM t WHERE "active" = true AND "category" = 'cat-3'`],
    ['project 1 col', 'SELECT sum("amount") FROM t'],
    ['project all cols', 'SELECT * FROM t LIMIT 5000'],
];

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/**
 * A connection that can talk to the local minio.
 *
 * `url_style = 'path'` is required: minio serves buckets as a path segment, where AWS defaults to a
 * virtual-host style that resolves to a hostname minio does not answer to. `use_ssl = false` because
 * the test endpoint is plain HTTP. Everything else is the ordinary S3 path.
*/
async function applyProfile(connection, profile) {
    for (const statement of PROFILES[profile] ?? []) await connection.run(statement);
}

async function s3Connection(instance) {
    const connection = await instance.connect();
    // minio's filesystem backend exposes each top-level directory under /data as a bucket, so the
    // bucket is created by making the directory - DuckDB's COPY will not create one for you
    connection.__bucket = BUCKET;
    await connection.run('LOAD httpfs');
    await connection.run(`CREATE OR REPLACE SECRET bench (
        TYPE S3,
        KEY_ID '${S3_KEY}',
        SECRET '${S3_SECRET}',
        ENDPOINT '${S3_ENDPOINT}',
        URL_STYLE 'path',
        USE_SSL false
    )`);
    return connection;
}

/* ------------------------------------------------------------------ run */

if (existsSync(SPOOL)) await rm(SPOOL, { recursive: true, force: true });

const { server, stats } = origin(SPOOL);
// backlog of 511: at 1,000 files a single query opens thousands of connections in a burst, and the
// default backlog drops them - which shows up as "Could not connect to server" and looks like a
// DuckDB failure rather than a bench one
// NOTE: do NOT set server.maxConnections = 0 - Node reads that as a limit of ZERO and refuses
// every connection, which surfaces as a DuckDB "Failure when receiving data from the peer".
await new Promise((resolve) => server.listen(0, '127.0.0.1', 511, resolve));
const port = server.address().port;
note(`origin on http://127.0.0.1:${port} serving ${SPOOL} (byte-range enabled)`);

for (const count of FILES) {
    heading(`${num(SCALE)} rows over ${count} files (${num(Math.round(SCALE / count))} rows each)`);
    const dir = join(SPOOL, `f${count}`);
    const paths = await generate(SCALE, count, dir);
    const onDisk = paths.reduce((sum, p) => sum + statSync(p).size, 0);

    const remoteList = `[${paths.map((p) => `'http://127.0.0.1:${port}/f${count}/${basename(p)}'`).join(',')}]`;
    const localList = `[${paths.map((p) => `'${p}'`).join(',')}]`;

    // push the same files into minio with DuckDB's own COPY, so the objects are byte-identical
    const upInstance = await DuckDBInstance.create(':memory:');
    const up = await s3Connection(upInstance);
    const s3Prefix = `s3://${BUCKET}/f${count}`;
    const upStart = performance.now();
    for (const path of paths) {
        await up.run(`COPY (SELECT * FROM read_parquet('${path}'))`
            + ` TO '${s3Prefix}/${basename(path)}' (FORMAT PARQUET)`);
    }
    note(`  uploaded ${count} objects to ${s3Prefix} in`
        + ` ${((performance.now() - upStart) / 1000).toFixed(1)}s`);
    up.disconnectSync();
    upInstance.closeSync();
    const s3List = `[${paths.map((p) => `'${s3Prefix}/${basename(p)}'`).join(',')}]`;

    const origins = [['local', localList], ['http', remoteList], ['s3', s3List]]
        .filter(([where]) => ORIGINS.includes(where));
    const cells = origins.flatMap(([where, list]) => (where === 'local'
        // the tunings are all about HTTP; running them against local disk measures nothing
        ? [[where, list, 'default']]
        : TUNINGS.map((profile) => [where, list, profile])));

    for (const [where, list, profile] of cells) {
        const instance = await DuckDBInstance.create(':memory:');
        const connection = where === 's3' ? await s3Connection(instance) : await instance.connect();
        if (where !== 's3') await connection.run('LOAD httpfs');
        await applyProfile(connection, profile);
        const tag = where === 'local' ? where : `${where}/${profile}`;
        await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet(${list})`);

        for (const [name, sql] of QUERIES) {
            const before = { ...stats, byFile: null };
            const samples = [];
            let failed = null;
            for (let i = 0; i < REPEATS; i++) {
                const start = performance.now();
                try {
                    await (await connection.run(sql)).getRowsJson();
                    samples.push(performance.now() - start);
                } catch (err) {
                    // an origin that cannot keep up is a fact about the ORIGIN; record it and carry
                    // on rather than losing every later cell to it
                    failed = err.message.split('\n')[0];
                    break;
                }
            }
            if (failed) {
                console.log(`  ${tag.padEnd(22)} ${name.padEnd(26)}FAILED: ${failed.slice(0, 60)}`);
                continue;
            }
            const reqs = stats.requests - before.requests;
            const bytes = stats.bytes - before.bytes;
            const detail = where === 'http'
                ? `  ${String(reqs).padStart(6)} reqs (${(reqs / count / REPEATS).toFixed(1)}/file/query)`
                    + `  ${kb(bytes / REPEATS).padStart(10)}/query`
                : '';
            console.log(`  ${tag.padEnd(22)} ${name.padEnd(26)}`
                + `cold ${samples[0].toFixed(0).padStart(6)} ms   warm ${median(samples.slice(1).length ? samples.slice(1) : samples).toFixed(0).padStart(6)} ms${detail}`);
        }
        connection.disconnectSync();
        instance.closeSync();
    }
    note(`  corpus on disk: ${kb(onDisk)} across ${count} files`);
}

heading('WHAT THIS MEANS FOR S3');
note('local HTTP has the request PATTERN of S3 and none of its latency. Multiply:');
note('  extra latency per query  =  requests/file x file count x your S3 round-trip');
note('  at 20 ms RTT and 1,000 files, even ONE request per file is 20 SECONDS per query');
note('so the design question for remote payloads is file COUNT first and file size second -');
note('the opposite weighting from local disk, where the per-file tax is ~32 microseconds');

server.close();
await rm(SPOOL, { recursive: true, force: true });
await closeDuckDatabase();
process.exit(0);
