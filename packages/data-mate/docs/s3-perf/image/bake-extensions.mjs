/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal (or a Docker build
// step) and reports to a human. There is no logger to route through.
/**
 * Bake the DuckDB extensions into the image at BUILD time.
 *
 * Run from the Dockerfile builder stage, where the network IS available. The
 * target environment has none, so anything not baked here can never load there.
 *
 * **Only what is genuinely missing is installed.** `icu`, `json` and `parquet`
 * are STATICALLY LINKED into libduckdb — verified by running with an empty
 * extension directory and no network, where `duckdb_extensions()` reports them
 * `STATICALLY_LINKED` and parquet round-trips fine. Running `INSTALL parquet`
 * would download a repository copy that SHADOWS the built-in one, adding ~72 MB
 * and making `duckdb_extensions()` misreport what the binary provides.
 *
 * Extensions are keyed by DuckDB version AND platform, so this must run inside
 * a container of the TARGET platform. It resolves the binding out of the repo's
 * own install, so the extension version can never drift from the binding.
 *
 * **They are installed to DuckDB's DEFAULT directory, deliberately** —
 * `$HOME/.duckdb/extensions/<version>/<platform>/`, not a custom path. Any
 * DuckDB instance in the container then finds them with NO configuration,
 * including the one `DuckFrame` creates internally, which never sees this
 * harness's settings. Baking to a custom directory works for code that passes
 * `extension_directory`, and silently breaks everything that does not.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/** Absent on the target box, and each one has NO fallback path there. */
const REQUIRED = [
    ['httpfs', 'S3/HTTP access — nothing works remotely without it'],
    ['aws', 'AWS credential provider chain'],
    ['inet', '21 IP function SQL emissions'],
    ['spatial', '13 geo emissions, which have NO UDF fallback (DF7)'],
];

/** Must NOT be installed — already in the binary. Asserted below. */
const EXPECTED_STATIC = ['icu', 'json', 'parquet'];

const require_ = createRequire(new URL('../../../package.json', import.meta.url));
const { DuckDBInstance } = await import(pathToFileURL(require_.resolve('@duckdb/node-api')).href);

const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();
const rows = async (sql) => (await connection.runAndReadAll(sql)).getRowsJson();

const platform = (await rows('PRAGMA platform'))[0][0];
const version = (await rows('SELECT version()'))[0][0];
console.log(
    `baking for duckdb ${version} on ${platform} -> `
    + `${process.env.HOME}/.duckdb/extensions/${version}/${platform}/`
);

// Assert the static three really are static BEFORE installing anything, so a
// future DuckDB version that unlinks one is caught at build time rather than
// discovered in the air-gapped box.
const staticNames = (await rows(
    `SELECT extension_name FROM duckdb_extensions() WHERE install_mode = 'STATICALLY_LINKED'`
)).map((r) => r[0]);

const unlinked = EXPECTED_STATIC.filter((name) => !staticNames.includes(name));
if (unlinked.length) {
    throw new Error(
        `${unlinked.join(', ')} used to be statically linked and no longer are. `
        + `Add them to REQUIRED in this file, or the image will not work offline.`
    );
}
console.log(`statically linked, not installed: ${EXPECTED_STATIC.join(', ')}`);

for (const [name, why] of REQUIRED) {
    await connection.run(`INSTALL ${name}`);
    await connection.run(`LOAD ${name}`);
    console.log(`  installed ${name.padEnd(9)} ${why}`);
}

instance.closeSync();
console.log('bake complete');
