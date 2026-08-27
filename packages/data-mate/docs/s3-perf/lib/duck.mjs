/**
 * Opening a DuckDB connection that is configured for the S3 endpoint.
 *
 * Everything here is applied explicitly. Nothing is left to a DuckDB default,
 * because two of the defaults are actively wrong for this deployment:
 *
 *   s3_use_ssl   defaults TRUE  — wrong for local minio over plain HTTP
 *   s3_url_style defaults vhost — wrong for Ceph RGW and minio, which want path
 *
 * and three more (the httpfs caches) are OFF by default and are the single
 * highest-value configuration decision for remote Parquet.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { config } from './env.mjs';
import { measure } from './report.mjs';

const require_ = createRequire(new URL('../../../package.json', import.meta.url));

/** Resolved from data-mate's own install, so it cannot drift from the frame's binding. */
export async function duckdb() {
    return import(pathToFileURL(require_.resolve('@duckdb/node-api')).href);
}

/** data-mate's built `dist` — the real DuckFrame, not a reimplementation. */
export async function duckFrame() {
    const dist = new URL('../../../dist/src/duck-frame/DuckFrame.js', import.meta.url);
    const loaded = await import(dist.href);
    if (typeof loaded.DuckFrame !== 'function') {
        throw new Error('data-mate dist has no DuckFrame export — the image build is broken');
    }
    return loaded;
}

/**
 * Apply the S3 credentials.
 *
 * Uses `CREATE SECRET`, the supported mechanism in DuckDB 1.x, rather than the
 * older `SET s3_access_key_id`. The secret is scoped to the endpoint so a
 * future second endpoint does not silently inherit these credentials.
 */
async function applyCredentials(connection) {
    const parts = [
        'TYPE s3',
        `KEY_ID '${config.accessKeyId.replace(/'/g, '\'\'')}'`,
        `SECRET '${config.secretAccessKey.replace(/'/g, '\'\'')}'`,
        `REGION '${config.region}'`,
        `ENDPOINT '${config.endpoint}'`,
        `URL_STYLE '${config.urlStyle}'`,
        `USE_SSL ${config.insecureDiagnostic ? false : config.useSsl}`,
    ];
    if (config.sessionToken) parts.push(`SESSION_TOKEN '${config.sessionToken}'`);

    await connection.run(`CREATE OR REPLACE SECRET s3_perf (${parts.join(', ')})`);
}

/**
 * Open an instance + connection ready to query the bucket.
 *
 * @param {object} [overrides]
 * @param {object} [overrides.caches]      per-cache booleans, for the cache axis
 * @param {string} [overrides.memoryLimit] e.g. '256MiB', for the memory sweep
 * @param {number} [overrides.threads]     for the threads axis
 */
export async function open(overrides = {}) {
    const { DuckDBInstance } = await duckdb();
    // No extension_directory. The image bakes extensions into DuckDB's DEFAULT
    // location, so the lookup path here is the same one DuckFrame's internal
    // instance uses — if it works here it works there.
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    // Refuse any silent network fallback. In the target environment there is no
    // network, so an autoload attempt is a slow failure rather than a rescue —
    // and locally it would mask a missing baked extension.
    await connection.run('SET autoinstall_known_extensions = false');
    await connection.run('SET autoload_known_extensions = false');

    for (const extension of ['httpfs', 'aws', 'parquet', 'json']) {
        await connection.run(`LOAD ${extension}`);
    }

    // --- engine ---
    await connection.run(`SET memory_limit = '${overrides.memoryLimit ?? config.memoryLimit}'`);
    // Without a temp directory an over-limit query FAILS instead of spilling.
    await connection.run(`SET temp_directory = '${config.tempDirectory}'`);
    const threads = overrides.threads ?? (config.threads ? Number(config.threads) : null);
    if (threads) await connection.run(`SET threads = ${threads}`);

    // --- endpoint ---
    await applyCredentials(connection);
    if (config.caCertFile) await connection.run(`SET ca_cert_file = '${config.caCertFile}'`);
    await connection.run(`SET http_timeout = ${config.httpTimeout * 1000}`);
    await connection.run(`SET http_retries = ${config.httpRetries}`);
    if (config.proxyHost) {
        await connection.run(`SET http_proxy = '${config.proxyHost}'`);
        if (config.proxyUsername) await connection.run(`SET http_proxy_username = '${config.proxyUsername}'`);
        if (config.proxyPassword) await connection.run(`SET http_proxy_password = '${config.proxyPassword}'`);
    }

    // --- caches ---
    const caches = { ...config.caches, ...(overrides.caches ?? {}) };
    await connection.run(`SET enable_http_metadata_cache = ${caches.httpMetadata}`);
    await connection.run(`SET parquet_metadata_cache = ${caches.parquetMetadata}`);
    await connection.run(`SET httpfs_connection_caching = ${caches.connection}`);
    await connection.run(`SET enable_external_file_cache = ${caches.externalFile}`);

    return {
        instance,
        connection,
        /** Rows as plain JS arrays, JSON-rendered (a BIGINT arrives as a string). */
        rows: async (sql) => (await connection.runAndReadAll(sql)).getRowsJson(),
        /** First column of the first row, for scalar queries. */
        one: async (sql) => (await connection.runAndReadAll(sql)).getRowsJson()[0]?.[0],
        close: () => instance.closeSync(),
    };
}

/**
 * Bytes actually read, from DuckDB's own profiler.
 *
 * **This is what makes the cache axis a measurement rather than an assertion.**
 * Turning the caches on changes the byte count by orders of magnitude, and
 * timing alone cannot separate a cache hit from a warm OS page cache.
 *
 * `duckdb_http_stats()` would be the direct answer but **does not exist in
 * DuckDB 1.5.5** — it throws `Catalog Error: Table Function with name
 * duckdb_http_stats does not exist`. An earlier version of this file caught
 * that and returned zero, which printed as "0 B" and read as a measurement
 * rather than as "unavailable". The profiler carries the same number.
 *
 * `profiling_output` is set to a FILE. Without it, `enable_profiling = 'json'`
 * dumps the whole profile tree to stdout and buries the report.
 */
export async function withHttpStats(session, fn) {
    const profilePath = `/tmp/duck-profile-${process.pid}.json`;

    await session.connection.run('SET enable_profiling = \'json\'');
    await session.connection.run(`SET profiling_output = '${profilePath}'`);

    let result;
    try {
        result = await fn();
    } finally {
        // Always restore, or every later query keeps writing profiles.
        await session.connection.run('SET enable_profiling = \'no_output\'');
    }

    let bytes = null;
    try {
        const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
        bytes = Number(profile.total_bytes_read ?? 0);
    } catch {
        // The profile is a diagnostic, not the measurement. A missing or
        // unparseable one leaves bytes NULL — reported as "n/a", never as 0.
        bytes = null;
    }

    return { result, bytes };
}

/**
 * Time a query, and separately report the bytes its FIRST run had to read.
 *
 * **Why the two are measured separately.** `measure()` runs a query several
 * times and reports the median, which is right for timing — the first touch of
 * a remote object pays for DNS, TLS and a cold metadata read that do not recur.
 * But profiling that same sequence captures the LAST run, which reads from the
 * external file cache and reports 0 bytes. An earlier version did exactly that
 * and printed "0 B" across the whole battery, which reads as "no data moved"
 * rather than "measured the warm run".
 *
 * So: one profiled cold run for the byte count, then the timed repeats.
 *
 * **"Cold" is per CONNECTION, not absolute.** Within one battery, an earlier
 * shape can warm the cache for a later one, so these bytes are a floor rather
 * than the true first-touch cost. `03-caches.mjs` opens a fresh connection per
 * profile, where the first query genuinely is cold.
 */
export async function measureQuery(session, sql, repeats) {
    const { bytes } = await withHttpStats(session, async () => {
        await session.connection.run(sql);
    });
    const timing = await measure(async () => {
        await session.connection.run(sql);
    }, repeats);
    return { ...timing, coldBytes: bytes };
}
