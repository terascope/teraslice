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
async function applyCredentials(run) {
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

    await run(`CREATE OR REPLACE SECRET s3_perf (${parts.join(', ')})`);
}

/**
 * Apply EVERY endpoint and engine setting to a connection, through a caller
 * supplied `run`.
 *
 * **Why this is a function and not a copied block.** `07-sql.mjs` drives a
 * DuckFrame, and a frame owns its OWN DuckDB instance — a second database that
 * shares nothing with the one `open()` returns. It has to be configured
 * separately, and the first version of that script hand-copied only the subset
 * that looked relevant: `LOAD httpfs`, the secret, the CA and the caches. It
 * silently omitted `LOAD aws`, `LOAD parquet`, `LOAD json`, the autoload
 * switches and the HTTP timeout and retry settings.
 *
 * The result was a script that worked wherever the omitted settings happened not
 * to matter and failed where they did — against a config the battery handled
 * fine, which reads as "the new script is broken" and is really "the frame's
 * database was set up differently".
 *
 * Anything that opens a second database MUST call this. Adding a setting to
 * `open()` alone would recreate exactly that divergence.
 *
 * @param {(sql: string) => Promise<unknown>} run  issues one statement
 * @param {object} [overrides]  same shape as `open()`'s
 */
export async function applyEndpointSettings(run, overrides = {}) {
    // Refuse any silent network fallback. In the target environment there is no
    // network, so an autoload attempt is a slow failure rather than a rescue —
    // and locally it would mask a missing baked extension.
    await run('SET autoinstall_known_extensions = false');
    await run('SET autoload_known_extensions = false');

    for (const extension of ['httpfs', 'aws', 'parquet', 'json']) {
        await run(`LOAD ${extension}`);
    }

    // --- engine ---
    await run(`SET memory_limit = '${overrides.memoryLimit ?? config.memoryLimit}'`);
    // Without a temp directory an over-limit query FAILS instead of spilling.
    await run(`SET temp_directory = '${config.tempDirectory}'`);
    /*
     * DuckDB defaults max_temp_directory_size to 90% OF AVAILABLE DISK, which on a
     * box with little free space means a spilling query can fill the filesystem
     * before it fails. Lowering memory_limit — the fix for peak RSS — makes
     * spilling MORE likely, so the two settings have to be chosen together.
     * Bounding it turns "the disk filled up" into a clean query error.
     */
    if (config.maxTempDirectorySize) {
        await run(
            `SET max_temp_directory_size = '${config.maxTempDirectorySize}'`
        );
    }
    const threads = overrides.threads ?? (config.threads ? Number(config.threads) : null);
    if (threads) await run(`SET threads = ${threads}`);

    // --- endpoint ---
    await applyCredentials(run);
    /*
     * SET GLOBAL, not SET. `ca_cert_file` is CONNECTION-scoped: a plain `SET`
     * leaves any connection opened later seeing `""`, and its first HTTPS read
     * fails with "SSL peer certificate ... was not OK". That is not theoretical
     * — it is exactly how `DuckFrame.rows()` broke against a private-CA
     * endpoint, because `rows()` takes its own connection by design.
     *
     * `CREATE SECRET` above is instance-scoped and needs no such treatment,
     * which is why credentials survived and only TLS broke — a confusing
     * symptom that looked like a credentials problem and was not.
     */
    if (config.caCertFile) {
        await run(`SET GLOBAL ca_cert_file = '${config.caCertFile}'`);
    } else {
        /*
         * NO CA CONFIGURED: turn verification off rather than fail.
         *
         * **DO NOT DESIGN AROUND A CA CERTIFICATE UNLESS IT IS THE ONLY
         * POSSIBLE WAY.** A CA file is an operational burden — it has to be
         * obtained, shipped to every box, mounted into every container and kept
         * in step with rotation — and here it buys nothing that a setting does
         * not.
         *
         * `enable_curl_server_cert_verification` defaults TRUE, so an endpoint
         * with a private CA fails "SSL peer certificate ... was not OK" unless a
         * PEM is supplied. Setting it false removes the requirement entirely.
         *
         * An earlier comment in `s3.env.example` asserted DuckDB had no such
         * switch. IT WAS WRONG, and repeating it cost a long diagnosis that
         * treated a config default as a hard constraint. Verified against 1.5.5:
         * `duckdb_settings()` lists `enable_curl_server_cert_verification`
         * alongside `ca_cert_file` and `enable_server_cert_verification`.
         *
         * Setting CA_CERT_FILE still works and still authenticates the server;
         * it is simply no longer required to connect.
         */
        await run('SET GLOBAL enable_curl_server_cert_verification = false');
    }
    await run(`SET http_timeout = ${config.httpTimeout * 1000}`);
    await run(`SET http_retries = ${config.httpRetries}`);
    if (config.proxyHost) {
        await run(`SET http_proxy = '${config.proxyHost}'`);
        if (config.proxyUsername) await run(`SET http_proxy_username = '${config.proxyUsername}'`);
        if (config.proxyPassword) await run(`SET http_proxy_password = '${config.proxyPassword}'`);
    }

    // --- caches ---
    const caches = { ...config.caches, ...(overrides.caches ?? {}) };
    await run(`SET enable_http_metadata_cache = ${caches.httpMetadata}`);
    await run(`SET parquet_metadata_cache = ${caches.parquetMetadata}`);
    await run(`SET httpfs_connection_caching = ${caches.connection}`);
    await run(`SET enable_external_file_cache = ${caches.externalFile}`);
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

    await applyEndpointSettings((sql) => connection.run(sql), overrides);

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
