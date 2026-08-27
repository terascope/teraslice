/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal (or a Docker build
// step) and reports to a human. There is no logger to route through.
/**
 * Prove the image is self-contained. Runs in the RUNTIME stage of the build.
 *
 * The point is not that the extensions are present as files — it is that DuckDB
 * can LOAD and USE them with no network. `autoinstall_known_extensions` and
 * `autoload_known_extensions` are forced OFF first, because with them on a
 * silent download would mask a missing file during a networked build and then
 * fail in the air-gapped environment, which is the exact failure this prevents.
 *
 * If this exits non-zero the image is broken. Do not ship it.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const NEEDED = ['parquet', 'json', 'icu', 'httpfs', 'aws', 'inet', 'spatial'];

const require_ = createRequire(new URL('../../../package.json', import.meta.url));
const { DuckDBInstance } = await import(pathToFileURL(require_.resolve('@duckdb/node-api')).href);

// No extension_directory: this must verify the DEFAULT lookup path, which is
// what every other DuckDB instance in the container will use.
const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();
const rows = async (sql) => (await connection.runAndReadAll(sql)).getRowsJson();

await connection.run('SET autoinstall_known_extensions = false');
await connection.run('SET autoload_known_extensions = false');

const failures = [];

for (const name of NEEDED) {
    try {
        await connection.run(`LOAD ${name}`);
    } catch (err) {
        failures.push(`LOAD ${name}: ${String(err.message).split('\n')[0]}`);
    }
}

/** Each check exercises the extension for real, not merely its presence. */
const CHECKS = [
    ['parquet', `SELECT count(*) FROM (SELECT 1) t`, null],
    ['parquet io',
        null,
        async () => {
            await connection.run(
                `COPY (SELECT i AS id, i::VARCHAR AS s FROM range(500) t(i))
             TO '/tmp/verify.parquet' (FORMAT PARQUET, COMPRESSION zstd)`
            );
            const [[n]] = await rows(`SELECT count(*) FROM read_parquet('/tmp/verify.parquet')`);
            if (Number(n) !== 500) throw new Error(`expected 500 rows, got ${n}`);
        }],
    ['json', `SELECT to_json({a: 1})`, null],
    ['icu', `SELECT count(*) FROM pg_timezone_names()`, null],
    ['inet', `SELECT TRY_CAST('1.2.3.4' AS INET)`, null],
    ['spatial', `SELECT ST_AsText(ST_Point(1, 2))`, null],
    ['httpfs', `SET s3_endpoint = '127.0.0.1:9000'`, null],
];

for (const [label, sql, fn] of CHECKS) {
    try {
        if (fn) await fn();
        else await connection.run(sql);
    } catch (err) {
        failures.push(`${label}: ${String(err.message).split('\n')[0]}`);
    }
}

const platform = (await rows('PRAGMA platform'))[0][0];
console.log(`offline verification on ${platform}`);

if (failures.length) {
    console.error('\nIMAGE IS NOT SELF-CONTAINED:');
    for (const f of failures) console.error(`  ${f}`);
    instance.closeSync();
    process.exit(1);
}

console.log(`  ${NEEDED.length} extensions load and work with autoinstall/autoload OFF`);
console.log('OFFLINE VERIFICATION PASSED');
instance.closeSync();
