/**
 * How many times is a scalar UDF actually CALLED? It is not once per row.
 *
 * A UDF over the 5-distinct-value `category` column measured 178 ns/value on an in-memory table but
 * 10 ns/value on the same data after a CHECKPOINT. If DuckDB is evaluating the function over a
 * DICTIONARY vector rather than over the rows, then UDF cost tracks DISTINCT VALUES, not row count -
 * which changes what every UDF measurement means, and which columns are expensive.
 *
 * The callback counts its own invocations, so this is not inference.
 *
 *     node packages/data-mate/docs/tools/bench/udf-cardinality.mjs
 *     ROWS=1000000 node .../udf-cardinality.mjs
*/
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const { DuckFrame, closeDuckDatabase, registerScalarFunction } = await import(
    dist('duck-frame/DuckFrame.js')
);
const { createScalarFunction } = await import(dist('duck-frame/scalar-function.js'));
const { DuckDBInstance } = await import(pathToFileURL(require.resolve('@duckdb/node-api')).href);
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const ROWS = Number(process.env.ROWS || 1_000_000);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-card-'));
const database = path.join(dir, 'corpus.duckdb');

let calls = 0;
const udf = () => createScalarFunction({
    name: 'udf_upper',
    parameter: 'Keyword',
    returns: { type: 'Keyword' },
    fn: (v) => {
        calls++;
        return String(v).toUpperCase();
    },
});

const log = (text) => {
    // eslint-disable-next-line no-console
    console.log(text);
};

/** `category` has 5 distinct values; `email` is distinct per row. */
const COLUMNS = ['category', 'email'];

log(`\n=== UDF invocations vs rows - ${ROWS.toLocaleString()} rows\n`);
log(`  ${'storage'.padEnd(24)}${'column'.padEnd(10)}${'time'.padStart(9)}`
    + `${'udf calls'.padStart(12)}${'calls/row'.padStart(11)}${'ns/row'.padStart(9)}`);

async function measure(label, run, table, column) {
    const sql = `SELECT sum(length(udf_upper("${column}"))) AS total FROM "${table}"`;
    await run(sql); // warm
    calls = 0;
    const start = performance.now();
    await run(sql);
    const ms = performance.now() - start;
    log(`  ${label.padEnd(24)}${column.padEnd(10)}${`${ms.toFixed(0)} ms`.padStart(9)}`
        + `${calls.toLocaleString().padStart(12)}${(calls / ROWS).toFixed(3).padStart(11)}`
        + `${((ms * 1e6) / ROWS).toFixed(0).padStart(9)}`);
}

// ---------------------------------------------------------------- in memory, freshly appended
const memFrame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'corpus' });
await registerScalarFunction({
    name: 'udf_upper',
    parameter: 'Keyword',
    returns: { type: 'Keyword' },
    fn: (v) => {
        calls++;
        return String(v).toUpperCase();
    },
});
const memRun = (sql) => memFrame.query(sql);
for (const column of COLUMNS) await measure('in-memory (appended)', memRun, memFrame.table, column);

// ---------------------------------------------------------------- same rows, checkpointed to a file
const fileFrame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'corpus', database });
const table = fileFrame.table;
await fileFrame.query('CHECKPOINT');
await closeDuckDatabase(database);

const instance = await DuckDBInstance.create(database, { access_mode: 'read_only' });
const fileConn = await instance.connect();
fileConn.registerScalarFunction(udf());
const fileRun = async (sql) => {
    const result = await fileConn.run(sql);
    await result.getRowsJson();
};
for (const column of COLUMNS) await measure('file, after CHECKPOINT', fileRun, table, column);

instance.closeSync();
await memFrame.destroy();
await closeDuckDatabase();
fs.rmSync(dir, { recursive: true, force: true });
process.exit(0);
