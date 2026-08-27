/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal and reports to a
// human. There is no logger to route through.
/**
 * Generate ONE Parquet fixture file at a given scale.
 *
 * Writes locally or straight to S3. Generation happens entirely inside DuckDB —
 * `range(n)` plus expressions — because the JS record generator is not reachable
 * at 1B rows at any price.
 *
 *   node generate-fixture.mjs --scale 100m --out /data/fixtures
 *   node generate-fixture.mjs --scale 1b --out s3://qpl-fixtures --env
 *   node generate-fixture.mjs --rows 5000000 --out /tmp --name probe.parquet
 *
 * Flags:
 *   --scale <1m|10m|100m|1b|10b>   one of the shipped scales
 *   --rows <n>                     an arbitrary row count instead of a scale
 *   --out <dir|s3://bucket>        destination directory or bucket
 *   --name <file.parquet>          override the generated name
 *   --level <n>                    zstd compression level (default 3)
 *   --env                          read S3 settings from the harness env file
 *   --dry                          print the plan and the SQL, write nothing
 *
 * **One file per scale, by request.** Note the trade-off this makes, which is
 * measured rather than assumed: query cost tracks ROW GROUPS, not files, and a
 * single file at 10B rows holds roughly 81,000 of them. The whole footer must be
 * parsed to plan any query, `count(*)` included. `inspect-fixture.mjs` reports
 * the footer size and the planning cost so the number is known rather than
 * feared.
 */
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { SCALES, fixtureName, fixtureSql, FIXTURE_VERSION } from './schema.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
    const at = argv.indexOf(`--${name}`);
    return at === -1 ? fallback : (argv[at + 1] ?? true);
};
const has = (name) => argv.includes(`--${name}`);

const scaleKey = flag('scale');
const explicitRows = flag('rows');
const out = flag('out');
const level = Number(flag('level', 3));
const dry = has('dry');

if (!out && !dry) {
    console.error('--out is required (a directory, or s3://bucket)');
    process.exit(1);
}
if (!scaleKey && !explicitRows) {
    console.error(`--scale is required, one of: ${Object.keys(SCALES).join(', ')}  (or --rows <n>)`);
    process.exit(1);
}
if (scaleKey && !SCALES[scaleKey]) {
    console.error(`unknown scale '${scaleKey}'. Known: ${Object.keys(SCALES).join(', ')}`);
    process.exit(1);
}

const rows = explicitRows ? Number(explicitRows) : SCALES[scaleKey].rows;
const name = flag('name', scaleKey ? fixtureName(scaleKey) : `qpl-fixture-${FIXTURE_VERSION}-${rows}.parquet`);
const toS3 = String(out).startsWith('s3://');
const target = out === null
    ? `<--out>/${name}`
    : (toS3 ? `${String(out).replace(/\/$/, '')}/${name}` : join(out, name));

const num = (n) => Number(n).toLocaleString();
const bytes = (n) => {
    const v = Number(n);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(Math.max(v, 1)) / Math.log(1024)));
    return `${(v / 1024 ** i).toFixed(2)} ${units[i]}`;
};

const sql = fixtureSql(rows);

console.log('');
console.log('  fixture      ', name);
console.log('  rows         ', num(rows));
console.log('  destination  ', target);
console.log('  compression  ', `zstd level ${level}`);
console.log('  row groups   ', `~${num(Math.ceil(rows / 122880))} (DuckDB default 122,880 rows each)`);
console.log('');

if (dry) {
    console.log('--- SQL ---');
    console.log(sql);
    process.exit(0);
}

const require_ = createRequire(new URL('../../../package.json', import.meta.url));
const { DuckDBInstance } = await import(pathToFileURL(require_.resolve('@duckdb/node-api')).href);

const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();

// Generation streams, but the writer still buffers a row group per thread. A
// temp directory means an over-limit moment spills instead of failing.
const memoryLimit = process.env.MEMORY_LIMIT || '8GiB';
await connection.run(`SET memory_limit = '${memoryLimit}'`);
await connection.run(`SET temp_directory = '${process.env.TEMP_DIRECTORY || '/tmp/duckdb-fixture-spill'}'`);
if (process.env.THREADS) await connection.run(`SET threads = ${Number(process.env.THREADS)}`);

if (toS3) {
    // Reuse the harness's own S3 configuration rather than a second copy of it.
    const { config } = await import('../lib/env.mjs');
    await connection.run('LOAD httpfs');
    if (config.caCertFile) await connection.run(`SET GLOBAL ca_cert_file = '${config.caCertFile}'`);
    await connection.run(`CREATE OR REPLACE SECRET fixture_s3 (
        TYPE s3,
        KEY_ID '${config.accessKeyId.replace(/'/g, '\'\'')}',
        SECRET '${config.secretAccessKey.replace(/'/g, '\'\'')}',
        REGION '${config.region}',
        ENDPOINT '${config.endpoint}',
        URL_STYLE '${config.urlStyle}',
        USE_SSL ${config.useSsl}
    )`);
    console.log(`  s3 endpoint  ${config.endpoint} (ssl ${config.useSsl}, ${config.urlStyle}-style)`);
} else {
    mkdirSync(out, { recursive: true });
}

console.log('  generating — this is one streaming COPY, so there is no progress until it lands');
console.log('');

const started = process.hrtime.bigint();
await connection.run(
    `COPY (${sql}) TO '${target}' (FORMAT PARQUET, COMPRESSION zstd, COMPRESSION_LEVEL ${level})`
);
const seconds = Number(process.hrtime.bigint() - started) / 1e9;

console.log(`  wrote in ${seconds.toFixed(1)} s  (${num(Math.round(rows / seconds))} rows/s)`);

if (!toS3 && existsSync(target)) {
    const size = statSync(target).size;
    console.log(`  size         ${bytes(size)}`);
    console.log(`  bytes/row    ${(size / rows).toFixed(2)}`);
    console.log(`  per million  ${bytes((size / rows) * 1_000_000)}`);
}

console.log('');
console.log(`  inspect it:  node fixtures/inspect-fixture.mjs ${toS3 ? target : target}`);
instance.closeSync();
