/**
 * CONSOLIDATION vs NOT, crossed with LOCAL vs S3, at REAL slice sizes.
 *
 * **The architecture this models — get it right, it has been gotten wrong repeatedly.**
 *
 *     qpl-search-api   STATELESS and DISTRIBUTED. One request -> <=100k records -> Parquet ->
 *                      returned OVER THE WIRE. It has no state, consecutive slices may hit
 *                      different instances, so it CANNOT batch. Ever.
 *     qpl-worker       The ONLY stateful component. Its slicers/fetchers call the api and it
 *                      RECEIVES EVERY PAYLOAD'S BYTES. It is the only place batching can happen.
 *
 * **The question.** The worker has a Parquet payload in hand. It can either persist it as-is - one
 * object per slice - or hold several and write one bigger object. Every slice is 10k-100k rows,
 * always below DuckDB's 122,880-row group, so no single payload can ever fill one.
 *
 * **Why consolidation is NOT free, which an earlier note in these docs wrongly claimed.** The two
 * paths are not the same operation:
 *
 *   | path | what the worker does | cost |
 *   |---|---|---|
 *   | no consolidation | persists the received bytes VERBATIM | a byte copy. No decode. |
 *   | consolidation | **decode N payloads, merge, re-encode + zstd** | real CPU, scales with DATA |
 *
 * That asymmetry is the entire measurement. Consolidation buys full row groups (worth up to 11x on
 * selective queries at 10k slices) and pays for them in CPU at land time, once.
 *
 * **Slice sizes are VARIABLE in reality**, and fixed sizes hide that: a real run is a ragged mix of
 * 10k-100k payloads, so row-group fill is uneven in a way a uniform corpus never shows. `variable` is
 * the realistic profile here; `fixed 10k` and `fixed 100k` are the bounds.
 *
 * **What is and is not measured on S3.** Land cost is measured on LOCAL DISK, because that isolates
 * the byte-copy-vs-re-encode CPU difference, which is the portable finding. Query cost is measured on
 * both local disk and real minio. **Localhost minio has a sub-millisecond round trip and cannot
 * represent real S3 write latency**, so object counts are reported instead - multiply them by your own
 * PUT cost and per-GET round trip.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/consolidation-matrix.mjs
 *   TOTAL=20000000 PROFILES=variable node .../consolidation-matrix.mjs
 *   TOTAL=5000000 ORIGINS=local node .../consolidation-matrix.mjs      # skip S3
 */
import { rm, mkdir, stat, readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const exec = promisify(execFile);

const TOTAL = Number(process.env.TOTAL || 10_000_000);
const PROFILES = (process.env.PROFILES || 'variable,fixed10k,fixed100k').split(',');
const ORIGINS = (process.env.ORIGINS || 'local,s3').split(',');
const REPEATS = Number(process.env.REPEATS || 3);
const SPOOL = process.env.SPOOL || '/tmp/duck-consol';
/**
 * A UNIQUE bucket per run.
 *
 * `rm -rf`-ing a bucket directory out from under minio leaves its internal state inconsistent, and
 * the NEXT run then gets `403 AccessDenied` on a write to that name with no other explanation. A
 * per-process name means a poisoned bucket can never block a later run.
 */
const BUCKET = process.env.BUCKET || `duck-consol-${process.pid}`;
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'localhost:49000';
const CONTAINER = process.env.CONTAINER || 'duck-bench-minio';
const ROW_GROUP = 122_880;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const QUERIES = [
    ['count(*)', 'SELECT count(*) FROM {T}'],
    ['selective filter', `SELECT count(*) FROM {T} WHERE "active" = true AND "category" = 'gamma'`],
    ['range + eq', `SELECT count(*) FROM {T} WHERE "amount" BETWEEN 100 AND 500 AND "status" = 'active'`],
    ['agg: 1 key', `SELECT "category", count(*), sum("amount") FROM {T} GROUP BY 1`],
    ['top 100 rows', 'SELECT * FROM {T} WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],
];

/**
 * Slice sizes as the fetchers would really produce them.
 *
 * `variable` is a deterministic pseudo-random mix in [10k, 100k] - deterministic because a benchmark
 * that cannot be re-run identically cannot be compared against itself.
 */
function sliceSizes(profile, total) {
    const out = [];
    let done = 0;
    let seed = 12345;
    const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    while (done < total) {
        let n;
        if (profile === 'fixed10k') n = 10_000;
        else if (profile === 'fixed100k') n = 100_000;
        else n = 10_000 + Math.floor(next() * 90_000);
        n = Math.min(n, total - done);
        out.push(n);
        done += n;
    }
    return out;
}

const sqlList = (ps) => `[${ps.map((p) => `'${p}'`).join(', ')}]`;

async function dirStats(dir) {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.parquet'));
    let bytes = 0;
    for (const f of files) bytes += (await stat(join(dir, f))).size;
    return { files: files.length, bytes };
}

const instance = await DuckDBInstance.create(':memory:');
const local = await instance.connect();
await local.run(`SET checkpoint_threshold = '1TB'`);

async function s3Conn() {
    const c = await instance.connect();
    await c.run('LOAD httpfs');
    await c.run(`CREATE OR REPLACE SECRET bench (
        TYPE S3, KEY_ID 'minioadmin', SECRET 'minioadmin',
        ENDPOINT '${S3_ENDPOINT}', URL_STYLE 'path', USE_SSL false)`);
    await c.run('SET enable_http_metadata_cache = true');
    await c.run('SET parquet_metadata_cache = true');
    await c.run('SET httpfs_connection_caching = true');
    return c;
}

async function census(paths) {
    const r = (await (await local.runAndReadAll(
        `SELECT sum(num_row_groups) FROM parquet_file_metadata(${sqlList(paths)})`
    )).getRows())[0][0];
    return Number(r);
}

async function battery(conn, uri) {
    const out = {};
    for (const [name, sql] of QUERIES) {
        const samples = [];
        for (let r = 0; r < REPEATS; r++) {
            const start = performance.now();
            await (await conn.runAndReadAll(sql.replace('{T}', `read_parquet('${uri}')`))).getRows();
            samples.push(performance.now() - start);
        }
        out[name] = median(samples.slice(1).length ? samples.slice(1) : samples);
    }
    return out;
}

await rm(SPOOL, { recursive: true, force: true });
await mkdir(SPOOL, { recursive: true });

const rows = [];

for (const profile of PROFILES) {
    const sizes = sliceSizes(profile, TOTAL);
    heading(`${profile.toUpperCase()} — ${num(TOTAL)} rows in ${num(sizes.length)} slices`
        + ` (min ${num(Math.min(...sizes))}, max ${num(Math.max(...sizes))},`
        + ` avg ${num(TOTAL / sizes.length)})`);

    /* --- the api-server's output: one Parquet payload per slice, as RECEIVED by the worker --- */
    const inbox = join(SPOOL, `${profile}-inbox`);
    await mkdir(inbox, { recursive: true });
    const received = [];
    let done = 0;
    for (const [i, n] of sizes.entries()) {
        const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(n, done + 1), { name: `p${i}` });
        const p = join(inbox, `r${String(i).padStart(6, '0')}.parquet`);
        await frame.writeParquet(p);
        await frame.destroy();
        received.push(p);
        done += n;
    }
    const inboxStats = await dirStats(inbox);
    note(`  payloads as received: ${num(inboxStats.files)} files, ${mb(inboxStats.bytes)},`
        + ` ${num(await census(received))} row groups`);

    /* --- LAYOUT A: no consolidation. Persist the bytes VERBATIM. --- */
    const rawDir = join(SPOOL, `${profile}-raw`);
    await mkdir(rawDir, { recursive: true });
    const rawStart = performance.now();
    const rawPaths = [];
    for (const [i, src] of received.entries()) {
        const dst = join(rawDir, `p${String(i).padStart(6, '0')}.parquet`);
        await copyFile(src, dst);          // a BYTE COPY - no decode, no re-encode
        rawPaths.push(dst);
    }
    const rawMs = performance.now() - rawStart;
    const rawStats = await dirStats(rawDir);
    const rawGroups = await census(rawPaths);
    note(`  A. no consolidation : ${(rawMs / 1000).toFixed(2)}s to land,`
        + ` ${num(rawStats.files)} objects, ${num(rawGroups)} row groups, ${mb(rawStats.bytes)}`);

    /* --- LAYOUTS B/C: consolidate. DECODE + merge + RE-ENCODE. --- */
    async function consolidateTo(targetRows, tag, label) {
        const dir = join(SPOOL, `${profile}-${tag}`);
        await mkdir(dir, { recursive: true });
        const start = performance.now();
        const out = [];
        let batch = [];
        let batchRows = 0;
        const flush = async () => {
            if (!batch.length) return;
            const p = join(dir, `c${String(out.length).padStart(6, '0')}.parquet`);
            await local.run(`COPY (SELECT * FROM read_parquet(${sqlList(batch)}))
                TO '${p}' (FORMAT parquet, COMPRESSION zstd)`);
            out.push(p);
            batch = [];
            batchRows = 0;
        };
        for (const [i, src] of received.entries()) {
            batch.push(src);
            batchRows += sizes[i];
            if (batchRows >= targetRows) await flush();
        }
        await flush();
        const ms = performance.now() - start;
        const st = await dirStats(dir);
        const groups = await census(out);
        note(`  ${label}: ${(ms / 1000).toFixed(2)}s to land,`
            + ` ${num(st.files)} objects, ${num(groups)} row groups, ${mb(st.bytes)}`
            + `  (${(ms / rawMs).toFixed(1)}x the byte-copy cost)`);
        return { dir, paths: out, ms, ...st, groups };
    }

    const b = await consolidateTo(ROW_GROUP, 'rg', 'B. consolidate >=123k ');
    const cc = await consolidateTo(2_000_000, 'big', 'C. consolidate ~2M   ');

    /* --- query each layout, on each origin --- */
    const LAYOUTS = [
        ['A no consolidation', rawDir, rawMs, rawStats.files, rawGroups, rawStats.bytes],
        ['B consolidate 123k', b.dir, b.ms, b.files, b.groups, b.bytes],
        ['C consolidate 2M', cc.dir, cc.ms, cc.files, cc.groups, cc.bytes],
    ];

    for (const [label, dir, landMs, files, groups, bytes] of LAYOUTS) {
        const entry = {
            profile, label, landMs, files, groups, bytes, q: {},
        };
        if (ORIGINS.includes('local')) {
            entry.q.local = await battery(local, `${dir}/*.parquet`);
        }
        if (ORIGINS.includes('s3')) {
            const prefix = `${profile}-${label.split(' ')[0]}`;
            await exec('docker', ['exec', CONTAINER, 'mkdir', '-p', `/data/${BUCKET}/${prefix}`]);
            const c = await s3Conn();
            /**
             * Upload ONE OBJECT PER FILE, through the S3 API.
             *
             * `docker cp` of the raw bytes does NOT work: this minio stores objects with its own
             * metadata, so files dropped into `/data/<bucket>` are not valid objects and
             * `read_parquet` reports "No files found that match the pattern".
             *
             * A per-file `COPY` re-encodes, which is why **land cost is measured on local disk
             * above and never from this loop**. The layout - object count and row groups per object -
             * is preserved exactly, and that is all the S3 READ measurement needs.
             */
            const files = (await readdir(dir)).filter((f) => f.endsWith('.parquet')).sort();
            for (const f of files) {
                await c.run(`COPY (SELECT * FROM read_parquet('${join(dir, f)}'))
                    TO 's3://${BUCKET}/${prefix}/${f}' (FORMAT parquet, COMPRESSION zstd)`);
            }
            entry.q.s3 = await battery(c, `s3://${BUCKET}/${prefix}/*.parquet`);
            c.disconnectSync();
        }
        rows.push(entry);
    }

    await rm(inbox, { recursive: true, force: true });
    for (const [, dir] of LAYOUTS) await rm(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ report */

heading('THE MATRIX — land cost once, query cost every time');
for (const origin of ORIGINS) {
    console.log(`\n  ${origin.toUpperCase()}`);
    console.log(`    ${'profile'.padEnd(11)}${'layout'.padEnd(20)}${'land'.padStart(8)}`
        + `${'objects'.padStart(9)}${'groups'.padStart(8)}${'size'.padStart(11)}`
        + QUERIES.map(([n]) => n.slice(0, 14).padStart(16)).join(''));
    for (const r of rows) {
        if (!r.q[origin]) continue;
        console.log(`    ${r.profile.padEnd(11)}${r.label.padEnd(20)}`
            + `${`${(r.landMs / 1000).toFixed(1)}s`.padStart(8)}${num(r.files).padStart(9)}`
            + `${num(r.groups).padStart(8)}${mb(r.bytes).padStart(11)}`
            + QUERIES.map(([n]) => r.q[origin][n].toFixed(1).padStart(16)).join(''));
    }
}

heading('BREAK-EVEN — queries before consolidation repays its land cost');
for (const origin of ORIGINS) {
    for (const profile of PROFILES) {
        const base = rows.find((r) => r.profile === profile && r.label.startsWith('A') && r.q[origin]);
        if (!base) continue;
        for (const r of rows.filter((x) => x.profile === profile && !x.label.startsWith('A') && x.q[origin])) {
            const tot = (e) => QUERIES.reduce((a, [n]) => a + e.q[origin][n], 0);
            const saved = tot(base) - tot(r);
            const extra = r.landMs - base.landMs;
            const verdict = saved <= 0
                ? 'NEVER — not faster'
                : `${Math.ceil(extra / saved)} queries`;
            note(`  ${origin.padEnd(6)} ${profile.padEnd(11)} ${r.label.padEnd(20)}`
                + ` saves ${saved.toFixed(0)} ms/query, costs ${(extra / 1000).toFixed(1)}s extra -> ${verdict}`);
        }
    }
}

heading('WHAT THESE NUMBERS ARE NOT');
note('  Land cost is LOCAL DISK: it isolates byte-copy vs decode+merge+re-encode, which is the');
note('  portable CPU finding. Localhost minio cannot represent real S3 write latency or per-GET RTT.');
note('  Multiply the OBJECT COUNT by your own PUT cost and 20-100 ms per cold GET.');

local.disconnectSync();
instance.closeSync();
await exec('docker', ['exec', CONTAINER, 'rm', '-rf', `/data/${BUCKET}`]).catch(() => {});
await rm(SPOOL, { recursive: true, force: true });
await closeDuckDatabase();
process.exit(0);
