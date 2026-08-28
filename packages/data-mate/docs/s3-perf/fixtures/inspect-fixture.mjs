/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal and reports to a
// human. There is no logger to route through.
/**
 * Report what a fixture actually contains, and what its single-file layout costs.
 *
 *   node fixtures/inspect-fixture.mjs /data/fixtures/qpl-fixture-v1-100m.parquet
 *   node fixtures/inspect-fixture.mjs s3://qpl-fixtures/v1/100m/... --env
 *
 * **Why the footer matters, and why it is measured rather than assumed.** These
 * fixtures are ONE file per scale by request. Query cost tracks ROW GROUPS, not
 * files, and a single file at 10B rows holds roughly 81,000 of them across 30
 * columns — about 2.4 million column-chunk metadata entries in one footer. The
 * whole footer is parsed to plan ANY query, `count(*)` included. That is the one
 * cost a single giant file has that many smaller files do not, so it is reported
 * here as a number instead of left as a worry.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const target = process.argv[2];
if (!target) {
    console.error('usage: node inspect-fixture.mjs <path|s3://url> [--env]');
    process.exit(1);
}

const num = (n) => Number(n).toLocaleString();
const bytes = (n) => {
    const v = Number(n);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(Math.max(v, 1)) / Math.log(1024)));
    return `${(v / 1024 ** i).toFixed(2)} ${units[i]}`;
};

const require_ = createRequire(new URL('../../../package.json', import.meta.url));
const { DuckDBInstance } = await import(pathToFileURL(require_.resolve('@duckdb/node-api')).href);
const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();
const rows = async (sql) => (await connection.runAndReadAll(sql)).getRowsJson();
const one = async (sql) => (await rows(sql))[0]?.[0];

if (target.startsWith('s3://')) {
    const { config } = await import('../lib/env.mjs');
    await connection.run('LOAD httpfs');
    if (config.caCertFile) await connection.run(`SET GLOBAL ca_cert_file = '${config.caCertFile}'`);
    await connection.run(`CREATE OR REPLACE SECRET fx (TYPE s3,
        KEY_ID '${config.accessKeyId}', SECRET '${config.secretAccessKey}',
        REGION '${config.region}', ENDPOINT '${config.endpoint}',
        URL_STYLE '${config.urlStyle}', USE_SSL ${config.useSsl})`);
}

console.log(`\n  ${target}\n`);

const meta = (await rows(
    `SELECT num_rows, num_row_groups FROM parquet_file_metadata('${target}')`
))[0];
const totalRows = Number(meta[0]);
const groups = Number(meta[1]);

const sizes = (await rows(
    `SELECT sum(total_compressed_size), sum(total_uncompressed_size), count(*)
     FROM parquet_metadata('${target}')`
))[0];
const [compressed, uncompressed, chunks] = sizes.map(Number);

const columns = Number(await one(
    `SELECT count(*) FROM parquet_schema('${target}') WHERE num_children IS NULL OR num_children = 0`
));

console.log('  CONTENT');
console.log(`    rows                ${num(totalRows)}`);
console.log(`    leaf columns        ${num(columns)}`);
console.log(`    compressed          ${bytes(compressed)}`);
console.log(`    uncompressed        ${bytes(uncompressed)}`);
console.log(`    ratio               ${(uncompressed / compressed).toFixed(2)}x`);
console.log(`    bytes/row           ${(compressed / totalRows).toFixed(2)}`);
console.log(`    per million rows    ${bytes((compressed / totalRows) * 1_000_000)}`);

console.log('\n  SINGLE-FILE LAYOUT');
console.log(`    row groups          ${num(groups)}`);
console.log(`    rows per group      ${num(Math.round(totalRows / Math.max(groups, 1)))}`);
console.log(`    column chunks       ${num(chunks)}  (= row groups x leaf columns; all in ONE footer)`);

/*
 * Planning cost. `parquet_file_metadata` reads the footer and nothing else, so
 * timing it isolates footer parsing from any data scan. `count(*)` is answered
 * from the same footer, so the two together show what every query pays before
 * it touches a single value.
 */
const timeIt = async (sql, repeats = 3) => {
    await connection.run(sql);
    const samples = [];
    for (let i = 0; i < repeats; i++) {
        const start = process.hrtime.bigint();
        await connection.run(sql);
        samples.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
    return samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)];
};

const footerMs = await timeIt(`SELECT * FROM parquet_file_metadata('${target}')`);
const countMs = await timeIt(`SELECT count(*) FROM read_parquet('${target}')`);

console.log(`    footer read         ${footerMs.toFixed(1)} ms`);
console.log(`    count(*)            ${countMs.toFixed(1)} ms  (footer only, no data scanned)`);
console.log(`    per row group       ${((countMs * 1000) / Math.max(groups, 1)).toFixed(1)} us`);

console.log('\n  WIDEST COLUMNS  (these are what make a wide SELECT * expensive)');
const widest = await rows(
    `SELECT path_in_schema, sum(total_compressed_size) c
     FROM parquet_metadata('${target}') GROUP BY 1 ORDER BY 2 DESC LIMIT 8`
);
for (const [n, c] of widest) {
    console.log(`    ${String(n).padEnd(24)} ${bytes(c).padStart(10)}  ${((Number(c) / compressed) * 100).toFixed(1)}%`);
}

console.log('\n  QUERY-BATTERY SELECTIVITY  (these must stay stable across regenerations)');
const checks = [
    ['active = true AND category = \'gamma\'', `"active" = true AND "category" = 'gamma'`],
    ['amount BETWEEN 100 AND 5000', `"amount" BETWEEN 100 AND 5000`],
    ['email LIKE \'user1%\'', `"email" LIKE 'user1%'`],
    ['category IN (\'alpha\',\'gamma\')', `"category" IN ('alpha','gamma')`],
    ['status = \'active\'', `"status" = 'active'`],
];
// One pass for all five: a separate scan each would read the file five times.
const selectivity = (await rows(
    `SELECT ${checks.map(([, p], i) => `count(*) FILTER (WHERE ${p}) AS c${i}`).join(', ')},
            count(DISTINCT "name") AS names
     FROM read_parquet('${target}')`
))[0];
checks.forEach(([label], i) => {
    const n = Number(selectivity[i]);
    console.log(`    ${label.padEnd(38)} ${((n / totalRows) * 100).toFixed(1).padStart(5)}%  (${num(n)})`);
});
console.log(`    ${'distinct name (group-by key)'.padEnd(38)} ${num(selectivity[checks.length]).padStart(6)} groups`);

console.log('');
instance.closeSync();
