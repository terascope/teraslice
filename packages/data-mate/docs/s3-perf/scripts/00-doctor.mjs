/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal (or a Docker build
// step) and reports to a human. There is no logger to route through.
/**
 * STEP 1 — prove the environment works before measuring anything with it.
 *
 * Checks, in the order a failure would actually occur:
 *   1. config is present and internally consistent   (no network touched)
 *   2. the DuckDB extensions load with NO network fallback allowed
 *   3. the endpoint answers, and the credentials are accepted
 *   4. the bucket holds objects matching S3_GLOB
 *   5. one of them is readable Parquet
 *
 * Every failure prints what to change and where. Run this first, every time —
 * it is fast, and it turns "the battery threw" into "S3_URL_STYLE is wrong".
 */
import {
    config, envFile, validate, s3Glob, s3Root
} from '../lib/env.mjs';
import { readFileSync } from 'node:fs';
import { open } from '../lib/duck.mjs';
import {
    heading, note, table, bytes, num, explain
} from '../lib/report.mjs';

let failed = false;
const fail = (msg) => {
    failed = true;
    console.log(`  FAIL  ${msg}`);
};
const pass = (msg) => console.log(`  ok    ${msg}`);

heading('1. CONFIGURATION');
note(`env file: ${envFile}`);
note('');

const problems = validate();
if (problems.length) {
    for (const p of problems) fail(p);
    console.log('\n  Fix the above in the env file, then re-run. Nothing else was attempted.');
    process.exit(1);
}
pass('all required settings present and consistent');

/*
 * The most expensive mistake this harness can make is not a wrong endpoint — it
 * is an OOM kill 20 minutes into a run, which reads as "DuckDB cannot do this"
 * and is really "the limit was set above what the box has". memory_limit bounds
 * the buffer manager, NOT resident memory: measured, peak RSS lands at roughly
 * 2x the limit. So check the limit against the cgroup before anything runs.
 */
/*
 * Peak RSS is NOT a multiple of memory_limit — it is a floor plus a slope. The
 * floor (node, DuckDB, the external file cache, allocator retention) is there
 * whatever the limit, and a process running many queries keeps the high-water
 * mark of all of them. Fitted against a full 10-shape battery at 100M over Ceph:
 * 512MiB->4050, 1GiB->5137, 2GiB->7318 MiB.
 *
 * An earlier version of this check used a flat 2x, which came from SINGLE-query
 * probes and understates a real run by ~1.8x — the optimistic direction, so it
 * would have passed a config that then got OOM-killed 20 minutes in.
 */
const RSS_FLOOR_BYTES = 2965 * 1024 ** 2;
const RSS_PER_LIMIT = 2.13;
const predictRss = (limit) => RSS_FLOOR_BYTES + limit * RSS_PER_LIMIT;
const memBytes = (raw) => {
    const m = String(raw).trim()
        .match(/^([\d.]+)\s*(TiB|GiB|MiB|KiB|TB|GB|MB|KB|B)?$/i);
    if (!m) return null;
    const units = {
        b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12,
        kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4,
    };
    return Number(m[1]) * (units[(m[2] || 'B').toLowerCase()] ?? 1);
};

const containerLimit = () => {
    for (const f of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
        try {
            const v = readFileSync(f, 'utf8').trim();
            if (v && v !== 'max') {
                const n = Number(v);
                // An unset cgroup reports a sentinel near 2^63, not a real cap.
                if (Number.isFinite(n) && n > 0 && n < 2 ** 62) return n;
            }
        } catch { /* not cgroup v2, or not containerised */ }
    }
    return null;
};

const gib = (n) => `${(n / 1024 ** 3).toFixed(1)} GiB`;
const limitBytes = memBytes(config.memoryLimit);
const capBytes = containerLimit();

if (limitBytes && capBytes) {
    const predicted = predictRss(limitBytes);
    if (predicted > capBytes) {
        fail(`MEMORY_LIMIT=${config.memoryLimit} predicts ~${gib(predicted)} peak RSS `
            + `against a ${gib(capBytes)} container cap.`);
        note('');
        note('  memory_limit bounds DuckDB\'s buffer pool, NOT the process. Measured on the');
        note('  100M fixture, a full battery peaks at ~3 GB PLUS ~2.1x the limit, so this');
        note('  run would be OOM-killed partway through — which looks like a DuckDB');
        note('  failure and is not one.');
        const headroom = capBytes * 0.8;
        const affordable = Math.max(0, (headroom - RSS_FLOOR_BYTES) / RSS_PER_LIMIT);
        if (affordable < 256 * 1024 ** 2) {
            note(`  This box cannot hold the ~${gib(RSS_FLOOR_BYTES)} floor plus a usable pool.`);
            note('  EXTERNAL_FILE_CACHE=false removes ~1.1 GB of that floor, at 3.7x on the battery.');
        } else {
            note(`  Set MEMORY_LIMIT to at most ${gib(affordable)} here.`);
        }
        process.exit(1);
    }
    pass(`MEMORY_LIMIT=${config.memoryLimit} predicts ~${gib(predicted)} peak RSS, `
        + `within the ${gib(capBytes)} cap`);
} else if (limitBytes && !capBytes) {
    note(`MEMORY_LIMIT=${config.memoryLimit} implies ~${gib(predictRss(limitBytes))} peak RSS `
        + '(no container cap detected — check it against the box\'s real RAM)');
}

table(
    ['setting', 'value'],
    [
        ['endpoint', config.endpoint],
        ['scheme', config.insecureDiagnostic ? 'http (DIAGNOSTIC OVERRIDE)' : (config.useSsl ? 'https' : 'http')],
        ['url style', config.urlStyle],
        ['region', config.region],
        ['access key', config.accessKeyId ? `${config.accessKeyId.slice(0, 4)}…` : '(none)'],
        ['secret key', config.secretAccessKey ? '(set)' : '(none)'],
        ['ca cert', config.caCertFile || '(system store)'],
        ['reading', s3Glob()],
        ['memory limit', config.memoryLimit],
        ['threads', config.threads || 'all cores'],
        ['caches',
            Object.entries(config.caches).filter(([, v]) => v)
                .map(([k]) => k)
                .join(', ') || 'ALL OFF'],
    ]
);

if (config.insecureDiagnostic) {
    note('');
    note('WARNING: S3_INSECURE_DIAGNOSTIC=true — this run talks plain HTTP.');
    note('Use it only to confirm a TLS fault. Do not record numbers from it.');
}

let session;
try {
    heading('2. DUCKDB AND EXTENSIONS (no network fallback permitted)');
    session = await open();
    pass(`duckdb ${await session.one('SELECT version()')} on ${await session.one('PRAGMA platform')}`);

    const loaded = (await session.rows(
        `SELECT extension_name FROM duckdb_extensions() WHERE loaded ORDER BY 1`
    )).map((r) => r[0]);
    for (const required of ['httpfs', 'aws', 'parquet', 'json']) {
        if (loaded.includes(required)) pass(`${required} loaded`);
        else fail(`${required} is NOT loaded — the image is broken, rebuild it`);
    }
    note(`also available: ${loaded.filter((e) => !['httpfs', 'aws', 'parquet', 'json'].includes(e)).join(', ')}`);

    heading('3. ENDPOINT AND CREDENTIALS');
    let objects = [];
    try {
        // glob() is the cheapest call that exercises DNS, TLS, signing and listing
        objects = await session.rows(`SELECT file FROM glob('${s3Glob()}') ORDER BY file`);
        pass(`endpoint answered and credentials accepted`);
    } catch (err) {
        fail('could not list the bucket');
        explain(err);
        process.exit(1);
    }

    heading('4. WHAT IS IN THE BUCKET');
    if (!objects.length) {
        fail(`no objects match ${s3Glob()}`);
        note('');
        note('The harness never generates data — the objects must be uploaded first.');
        note(`Check that S3_BUCKET (${config.bucket}) and S3_PREFIX (${config.prefix || '(none)'}) are right,`);
        note('and that the object names end in .parquet (or adjust S3_GLOB).');
        try {
            const any = await session.rows(`SELECT file FROM glob('${s3Root()}/**') LIMIT 10`);
            if (any.length) {
                note('');
                note('The bucket is NOT empty. First few objects, for reference:');
                for (const [f] of any) note(`   ${f}`);
            }
        } catch { /* the root glob is best-effort context, not a check */ }
        process.exit(1);
    }
    pass(`${num(objects.length)} object(s) match ${s3Glob()}`);
    for (const [file] of objects.slice(0, 5)) note(`   ${file}`);
    if (objects.length > 5) note(`   … and ${num(objects.length - 5)} more`);

    heading('5. READING ONE OBJECT');
    const first = objects[0][0];
    try {
        const cols = await session.rows(
            `SELECT count(*) FROM parquet_schema('${first}') WHERE num_children IS NULL OR num_children = 0`
        );
        const rows = await session.one(`SELECT count(*) FROM read_parquet('${first}')`);
        const size = await session.rows(
            `SELECT sum(total_compressed_size) FROM parquet_metadata('${first}')`
        );
        pass(`${first}`);
        note(`   ${num(rows)} rows, ${num(cols[0][0])} leaf columns, ${bytes(size[0][0])} compressed`);
    } catch (err) {
        fail(`could not read ${first} as Parquet`);
        explain(err);
        process.exit(1);
    }
} catch (err) {
    explain(err);
    process.exit(1);
} finally {
    session?.close();
}

heading(failed ? 'DOCTOR: PROBLEMS FOUND' : 'DOCTOR: ALL CHECKS PASSED');
if (!failed) {
    note('The environment is ready. Next:  ./run.sh discover');
}
process.exit(failed ? 1 : 0);
