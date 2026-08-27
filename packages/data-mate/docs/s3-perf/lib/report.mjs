/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal (or a Docker build
// step) and reports to a human. There is no logger to route through.
/**
 * Timing, formatting and result persistence.
 *
 * **Every timed number here is a MEDIAN of `REPEATS` runs after a discarded
 * warmup**, because the first touch of a remote object pays for DNS, the TLS
 * handshake and a cold metadata read, none of which recur. Reporting a single
 * cold run as "the query time" overstates it by an order of magnitude.
 *
 * The spread (min/max) is printed alongside, so a wildly variable cell is
 * visible rather than hidden behind its median.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './env.mjs';

export const ms = (n) => `${n.toFixed(1)} ms`;
export const num = (n) => Math.round(Number(n)).toLocaleString();

export function bytes(n) {
    // null means "not measured" and must NEVER render as 0 B — a zero reads as
    // a measurement. duckdb_http_stats() does not exist in 1.5.5 and an earlier
    // version of this harness printed its absence as 0 B across the board.
    if (n === null || n === undefined) return 'n/a';
    const v = Number(n);
    if (!Number.isFinite(v)) return 'n/a';
    if (v === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(Math.abs(v)) / Math.log(1024)));
    return `${(v / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const median = (xs) => {
    const sorted = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function heading(text) {
    console.log(`\n${text}`);
    console.log('='.repeat(Math.max(text.length, 60)));
}

export function note(text) {
    console.log(`  ${text}`);
}

/**
 * Time `fn` once. Returns milliseconds.
 * `process.hrtime.bigint()` rather than Date.now(), which has coarse resolution.
 */
export async function time(fn) {
    const start = process.hrtime.bigint();
    const value = await fn();
    return { millis: Number(process.hrtime.bigint() - start) / 1e6, value };
}

/**
 * Warmup + repeats. Returns the median, the spread and the last value.
 *
 * @param {() => Promise<any>} fn
 * @param {number} [repeats]  defaults to REPEATS from the env file
 */
export async function measure(fn, repeats = config.repeats) {
    await fn(); // warmup, discarded — it pays the one-time connection costs
    const timings = [];
    let value;
    for (let i = 0; i < repeats; i++) {
        const run = await time(fn);
        timings.push(run.millis);
        value = run.value;
    }
    return {
        median: median(timings),
        min: Math.min(...timings),
        max: Math.max(...timings),
        timings,
        value,
    };
}

/** A fixed-width table. Columns are sized to their widest cell. */
export function table(headers, rows) {
    const all = [headers, ...rows].map((r) => r.map((c) => String(c ?? '')));
    const widths = headers.map((_, i) => Math.max(...all.map((r) => (r[i] ?? '').length)));
    const line = (cells, pad = ' ') => cells
        .map((c, i) => (i === 0 ? c.padEnd(widths[i], pad) : c.padStart(widths[i], pad)))
        .join('  ');

    console.log(`  ${line(all[0])}`);
    console.log(`  ${widths.map((w) => '-'.repeat(w)).join('  ')}`);
    for (const row of all.slice(1)) console.log(`  ${line(row)}`);
}

/**
 * Persist a result set as JSON, for `scp` off the box afterwards.
 *
 * The run's full configuration is embedded, because a number without the
 * endpoint, cache profile, memory limit and thread count that produced it
 * cannot be compared against anything later.
 */
export function save(name, payload) {
    mkdirSync(config.resultsDir, { recursive: true });
    const path = join(config.resultsDir, `${name}.json`);
    const record = {
        script: name,
        // Stamped at write time; the harness itself never branches on the clock.
        recordedAt: new Date().toISOString(),
        config: {
            endpoint: config.endpoint,
            useSsl: config.useSsl,
            urlStyle: config.urlStyle,
            bucket: config.bucket,
            prefix: config.prefix,
            glob: config.glob,
            caches: config.caches,
            memoryLimit: config.memoryLimit,
            threads: config.threads || 'all cores',
            repeats: config.repeats,
        },
        ...payload,
    };
    writeFileSync(path, JSON.stringify(record, null, 2));
    console.log(`\n  results -> ${path}`);
    return path;
}

/**
 * Turn a DuckDB error into something actionable without a debugger.
 *
 * The target environment is offline and AI-free, so the harness has to do the
 * diagnosis that would otherwise be a web search.
 */
export function explain(err) {
    const message = String(err?.message ?? err);
    const hints = [
        [/no such file or directory|NoSuchBucket|HTTP GET error.*404|Not Found/i,
            'The bucket or prefix does not exist, or holds no objects matching S3_GLOB.\n'
            + '     Check S3_BUCKET and S3_PREFIX, then re-run `./run.sh discover`.'],
        [/SSL|certificate|CERTIFICATE_VERIFY|handshake/i,
            'A TLS problem. If Ceph uses a private CA, mount the PEM and set CA_CERT_FILE.\n'
            + '     To confirm it is certificate-related, set S3_INSECURE_DIAGNOSTIC=true once —\n'
            + '     that talks plain HTTP, so it is a diagnostic, never a way to record numbers.'],
        [/SignatureDoesNotMatch|InvalidAccessKeyId|403|Forbidden|AccessDenied/i,
            'Credentials were rejected. Check S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY.\n'
            + '     Ceph is also sensitive to S3_URL_STYLE — it usually needs `path`, not `vhost`.'],
        [/Connection error|Could not establish|timed out|timeout/i,
            'The endpoint did not answer. Check S3_ENDPOINT (host:port, NO https:// prefix),\n'
            + '     that the box can reach it, and whether HTTP_PROXY_HOST is needed.'],
        [/out of memory|Out of Memory|allocate/i,
            'DuckDB hit its memory limit. Either raise MEMORY_LIMIT, lower THREADS, or —\n'
            + '     if this is a wide `SELECT *` top-N — project fewer columns. The requirement\n'
            + '     is threads x row_group x columns, and is INDEPENDENT of dataset size.'],
        [/Extension.*not.*load|autoload|Catalog Error.*st_|Catalog Error.*inet/i,
            'An extension is missing from the image. It must be baked at BUILD time —\n'
            + '     the target environment has no network. Rebuild with Dockerfile.duckperf.'],
    ];

    console.error(`\n  ERROR: ${message.split('\n')[0]}`);
    for (const [pattern, hint] of hints) {
        if (pattern.test(message)) {
            console.error(`\n  LIKELY CAUSE:\n     ${hint}`);
            return;
        }
    }
    console.error('\n  No specific diagnosis. Full error:\n');
    console.error(message);
}
