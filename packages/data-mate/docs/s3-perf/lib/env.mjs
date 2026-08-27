/**
 * Reads and validates the run configuration.
 *
 * Config comes from the env file (default `/app/config/s3.env`) with real
 * environment variables taking precedence, so a single value can be overridden
 * on the command line without editing the file:
 *
 *     MEMORY_LIMIT=2GiB ./run.sh battery
 *
 * **Validation is strict and fails early with a specific message.** The target
 * environment is offline and has no AI assistance, so a wrong value must name
 * itself rather than surface later as an opaque DuckDB error.
 */
import { readFileSync, existsSync } from 'node:fs';

const ENV_FILE = process.env.S3_PERF_ENV_FILE || '/app/config/s3.env';

/** Minimal dotenv: `KEY=value`, `#` comments, optional surrounding quotes. */
function parseEnvFile(path) {
    if (!existsSync(path)) return {};
    const out = {};
    for (const raw of readFileSync(path, 'utf8').split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith('\'') && value.endsWith('\''))) {
            value = value.slice(1, -1);
        }
        out[key] = value;
    }
    return out;
}

const fileValues = parseEnvFile(ENV_FILE);

/** Real env wins over the file, so a one-off override needs no edit. */
function setting(key, fallback = '') {
    const fromEnv = process.env[key];
    if (fromEnv !== undefined && fromEnv !== '') return fromEnv;
    const fromFile = fileValues[key];
    if (fromFile !== undefined && fromFile !== '') return fromFile;
    return fallback;
}

const bool = (key, fallback) => {
    const raw = value(key, String(fallback)).toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(raw)) return true;
    if (['false', '0', 'no', 'off'].includes(raw)) return false;
    throw new Error(`${key} must be true or false, got "${raw}" (in ${ENV_FILE})`);
};

const int = (key, fallback) => {
    const raw = value(key, String(fallback));
    const n = Number(raw);
    if (!Number.isFinite(n)) {
        throw new Error(`${key} must be a number, got "${raw}" (in ${ENV_FILE})`);
    }
    return n;
};

export const envFile = ENV_FILE;

export const config = {
    endpoint: setting('S3_ENDPOINT'),
    useSsl: bool('S3_USE_SSL', false),
    urlStyle: setting('S3_URL_STYLE', 'path'),
    region: setting('S3_REGION', 'us-east-1'),
    accessKeyId: setting('S3_ACCESS_KEY_ID'),
    secretAccessKey: setting('S3_SECRET_ACCESS_KEY'),
    sessionToken: setting('S3_SESSION_TOKEN'),

    caCertFile: setting('CA_CERT_FILE'),
    insecureDiagnostic: bool('S3_INSECURE_DIAGNOSTIC', false),

    bucket: setting('S3_BUCKET'),
    prefix: setting('S3_PREFIX').replace(/^\/+/, '')
        .replace(/\/+$/, ''),
    glob: setting('S3_GLOB', '**/*.parquet'),

    httpTimeout: int('HTTP_TIMEOUT', 30),
    httpRetries: int('HTTP_RETRIES', 3),
    proxyHost: setting('HTTP_PROXY_HOST'),
    proxyUsername: setting('HTTP_PROXY_USERNAME'),
    proxyPassword: setting('HTTP_PROXY_PASSWORD'),

    caches: {
        httpMetadata: bool('HTTP_METADATA_CACHE', true),
        parquetMetadata: bool('PARQUET_METADATA_CACHE', true),
        connection: bool('HTTPFS_CONNECTION_CACHING', true),
        externalFile: bool('EXTERNAL_FILE_CACHE', true),
    },

    memoryLimit: setting('MEMORY_LIMIT', '8GiB'),
    threads: setting('THREADS'),
    tempDirectory: setting('TEMP_DIRECTORY', '/tmp/duckdb-spill'),

    repeats: int('REPEATS', 3),
    resultsDir: setting('RESULTS_DIR', process.env.S3_PERF_RESULTS || '/app/results'),
};

/** The `s3://` URL the harness queries. */
export function s3Glob() {
    const parts = [config.bucket, config.prefix, config.glob].filter(Boolean);
    return `s3://${parts.join('/')}`;
}

/** The bucket/prefix root, without the file pattern. */
export function s3Root() {
    const parts = [config.bucket, config.prefix].filter(Boolean);
    return `s3://${parts.join('/')}`;
}

/**
 * Config problems, as a list of human sentences. Empty means good to go.
 * Checked by `00-doctor.mjs` before anything touches the network.
 */
export function validate() {
    const problems = [];
    const need = (field, name, hint) => {
        if (!config[field]) problems.push(`${name} is empty. ${hint}`);
    };

    need('endpoint', 'S3_ENDPOINT', 'Set it to host:port, with no https:// prefix.');
    need('bucket', 'S3_BUCKET', 'Set it to the bucket holding the Parquet objects.');
    need('accessKeyId', 'S3_ACCESS_KEY_ID', 'Set the Ceph RGW user access key.');
    need('secretAccessKey', 'S3_SECRET_ACCESS_KEY', 'Set the Ceph RGW user secret key.');

    if (/^https?:\/\//i.test(config.endpoint)) {
        problems.push(
            `S3_ENDPOINT must NOT include a scheme. Use "${config.endpoint.replace(/^https?:\/\//i, '')}" `
            + 'and set S3_USE_SSL to choose http vs https.'
        );
    }
    if (!['path', 'vhost'].includes(config.urlStyle)) {
        problems.push(`S3_URL_STYLE must be 'path' or 'vhost', got '${config.urlStyle}'. Ceph and minio want 'path'.`);
    }
    if (config.caCertFile && !existsSync(config.caCertFile)) {
        problems.push(
            `CA_CERT_FILE points at ${config.caCertFile}, which does not exist in the container. `
            + 'Mount it in with -v /host/ca.pem:/app/config/ca.pem:ro'
        );
    }
    if (config.caCertFile && !config.useSsl) {
        problems.push('CA_CERT_FILE is set but S3_USE_SSL is false, so the certificate will never be used.');
    }
    if (config.insecureDiagnostic && config.useSsl) {
        problems.push(
            'S3_INSECURE_DIAGNOSTIC=true overrides S3_USE_SSL=true and will talk plain HTTP. '
            + 'That is a diagnostic only — unset it before recording any numbers.'
        );
    }
    if (/GB|MB$/.test(config.memoryLimit)) {
        problems.push(
            `MEMORY_LIMIT='${config.memoryLimit}' uses decimal units — DuckDB reads '2GB' as 2x10^9 bytes. `
            + 'Use binary units (GiB/MiB) so the number means what it says.'
        );
    }
    return problems;
}
