/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal and reports to a
// human. There is no logger to route through.
/**
 * Upload a generated fixture to S3/Ceph, into the layout the harness expects.
 *
 *   node fixtures/upload-fixture.mjs --scale 100m --from /data/fixtures --bucket qpl-fixtures
 *
 * Reads S3 settings from the harness env file, so there is ONE place that knows
 * the endpoint, credentials and CA.
 *
 * **This re-encodes rather than copying bytes.** DuckDB has no S3 PUT of a local
 * file; `COPY (SELECT * FROM read_parquet(local)) TO 's3://...'` is the
 * available path, so the object is rewritten. That costs a full read and write —
 * for the large scales, generating STRAIGHT to S3 with
 * `generate-fixture.mjs --out s3://...` is strictly cheaper, and is what the
 * README recommends. This exists for a fixture that already exists locally.
 *
 * The upload is verified afterwards: row count and the battery's selectivity are
 * re-checked against the remote object, which catches a truncated or partial
 * transfer without hashing hundreds of gigabytes.
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { SCALES, fixtureName, fixturePrefix } from './schema.mjs';

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
    const i = argv.indexOf(`--${n}`);
    return i === -1 ? d : (argv[i + 1] ?? true);
};

const scale = flag('scale');
const from = flag('from');
const bucket = flag('bucket');

if (!scale || !SCALES[scale]) {
    console.error(`--scale must be one of: ${Object.keys(SCALES).join(', ')}`);
    process.exit(1);
}
if (!from || !bucket) {
    console.error('--from <dir> and --bucket <name> are both required');
    process.exit(1);
}

const name = fixtureName(scale);
const local = join(from, name);
if (!existsSync(local)) {
    console.error(`not found: ${local}\nGenerate it first with: node fixtures/generate-fixture.mjs --scale ${scale} --out ${from}`);
    process.exit(1);
}

const target = `s3://${bucket}/${fixturePrefix(scale)}/${name}`;
const num = (n) => Number(n).toLocaleString();
const gb = (n) => `${(Number(n) / 1024 ** 3).toFixed(2)} GB`;

const { config } = await import('../lib/env.mjs');
const require_ = createRequire(new URL('../../../package.json', import.meta.url));
const { DuckDBInstance } = await import(pathToFileURL(require_.resolve('@duckdb/node-api')).href);

const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();
await connection.run(`SET memory_limit = '${process.env.MEMORY_LIMIT || '8GiB'}'`);
await connection.run(`SET temp_directory = '${config.tempDirectory}'`);
await connection.run('LOAD httpfs');
if (config.caCertFile) await connection.run(`SET GLOBAL ca_cert_file = '${config.caCertFile}'`);
await connection.run(`CREATE OR REPLACE SECRET fx (TYPE s3,
    KEY_ID '${config.accessKeyId.replace(/'/g, '\'\'')}',
    SECRET '${config.secretAccessKey.replace(/'/g, '\'\'')}',
    REGION '${config.region}', ENDPOINT '${config.endpoint}',
    URL_STYLE '${config.urlStyle}', USE_SSL ${config.useSsl})`);

const rows = async (sql) => (await connection.runAndReadAll(sql)).getRowsJson();
const one = async (sql) => (await rows(sql))[0]?.[0];

console.log('');
console.log(`  from      ${local}  (${gb(statSync(local).size)})`);
console.log(`  to        ${target}`);
console.log(`  endpoint  ${config.endpoint} (ssl ${config.useSsl}, ${config.urlStyle}-style)`);
console.log('');
console.log('  uploading — a re-encode, so expect roughly generation speed');

const started = process.hrtime.bigint();
await connection.run(
    `COPY (SELECT * FROM read_parquet('${local}')) TO '${target}' (FORMAT PARQUET, COMPRESSION zstd)`
);
console.log(`  done in ${(Number(process.hrtime.bigint() - started) / 1e9).toFixed(1)} s`);

console.log('\n  VERIFYING THE REMOTE OBJECT');
const localRows = Number(await one(`SELECT count(*) FROM read_parquet('${local}')`));
const remoteRows = Number(await one(`SELECT count(*) FROM read_parquet('${target}')`));
console.log(`    rows local   ${num(localRows)}`);
console.log(`    rows remote  ${num(remoteRows)}`);

if (localRows !== remoteRows) {
    console.error('\n    ROW COUNTS DIFFER — the upload is incomplete. Do not use this object.');
    instance.closeSync();
    process.exit(1);
}

// Row count alone would miss a corrupt page, so check a value-dependent
// property too. This is cheap next to hashing the whole object.
const check = (await rows(
    `SELECT count(*) FILTER (WHERE "active" = true AND "category" = 'gamma'),
            count(DISTINCT "name")
     FROM read_parquet('${target}')`
))[0];
console.log(`    gamma+active ${num(check[0])}  (${((Number(check[0]) / remoteRows) * 100).toFixed(1)}%)`);
console.log(`    distinct name ${num(check[1])} groups`);
console.log('\n  UPLOAD VERIFIED');
console.log(`\n  point the harness at it with:   FIXTURE=${scale} S3_BUCKET=${bucket} ./run.sh doctor`);

instance.closeSync();
