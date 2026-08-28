/**
 * OUTPUT: how fast can a result actually leave the frame?
 *
 * `rows()` - converting every value into a plain JS object - is the slowest possible way, and
 * for the real destination it is not even needed. A finished query result typically goes to S3
 * as **ldjson or CSV**, and DuckDB can write those itself, in C++, in parallel, without a single
 * value crossing into JavaScript.
 *
 * This measures every route out, so the choice is made on numbers:
 *
 *   1. `rows()`                  - the current async iterator, one JS object per row
 *   2. `rows()`, optimised       - a prototype: direct property assignment, per-column
 *                                  converters resolved once per chunk instead of a generic
 *                                  `toPlainValue` call per value
 *   3. `COPY ... (FORMAT JSON)`  - ldjson written by DuckDB
 *   4. `COPY ... (FORMAT CSV)`   - CSV written by DuckDB
 *   5. `COPY ... (FORMAT PARQUET)` - for comparison, the transport format
 *   6. ldjson built in JS from `rows()` - what "stream to S3 as ldjson" costs today
 *
 * Run: node packages/data-mate/docs/tools/bench/output-formats.js
 *      ROWS=5000000 node .../output-formats.js
*/
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {
    duckdb, since, rate, heading, note
} from '../lib/duck.js';

const { DuckDBInstance } = await duckdb();

const ROWS = Number(process.env.ROWS || 1_000_000);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duck-output-'));

const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();

/** A table shaped like a real result: strings, numbers, a date, a list, a struct. */
await connection.run(`
    CREATE TABLE t AS
    SELECT
        i AS id,
        ('key-' || i) AS _key,
        ('name ' || (i % 100000)) AS name,
        (i % 1000000)::BIGINT AS count,
        (i % 100) / 3.0 AS ratio,
        (i % 2 = 0) AS active,
        TIMESTAMP '2026-08-14 00:00:00' + INTERVAL (i % 86400) SECOND AS created,
        ['a', 'b'] AS tags,
        {'source': 'api', 'retries': i % 5} AS metadata
    FROM range(${ROWS}) tbl(i)
`);

const out = (name) => path.join(dir, name);
const mb = (file) => (fs.statSync(file).size / 1024 / 1024).toFixed(1);

heading(`OUTPUT of ${ROWS.toLocaleString()} rows (8 columns)`);

// ---------------------------------------------------------------- 1. rows(), as it is today
async function streamRowObjects(sql) {
    const conn = await instance.connect();
    let seen = 0;
    try {
        const result = await conn.stream(sql);
        const names = result.columnNames();
        for (;;) {
            const chunk = await result.fetchChunk();
            if (chunk == null || chunk.rowCount === 0) break;
            const columns = names.map((_n, i) => chunk.getColumnValues(i));
            for (let row = 0; row < chunk.rowCount; row++) {
                // the shape DuckFrame.streamRowObjects uses today
                const record = Object.fromEntries(
                    names.map((name, col) => [name, plain(columns[col][row])])
                );
                if (record._key === undefined) throw new Error('bad row');
                seen++;
            }
        }
    } finally {
        conn.disconnectSync();
    }
    return seen;
}

/** Stand-in for `toPlainValue`: generic, called once per VALUE. */
function plain(value) {
    if (value == null) return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value !== 'object') return value;
    const items = value.items;
    if (Array.isArray(items)) return items.map(plain);
    const entries = value.entries;
    if (entries != null && typeof entries === 'object') return { ...entries };
    return value;
}

// ------------------------------------------- 2. rows(), with per-column converters
async function streamRowObjectsFast(sql) {
    const conn = await instance.connect();
    let seen = 0;
    try {
        const result = await conn.stream(sql);
        const names = result.columnNames();
        const width = names.length;

        for (;;) {
            const chunk = await result.fetchChunk();
            if (chunk == null || chunk.rowCount === 0) break;

            const columns = new Array(width);
            const converters = new Array(width);
            for (let col = 0; col < width; col++) {
                columns[col] = chunk.getColumnValues(col);
                // decide ONCE per column per chunk, not once per value
                converters[col] = converterFor(columns[col]);
            }

            for (let row = 0; row < chunk.rowCount; row++) {
                const record = {};
                for (let col = 0; col < width; col++) {
                    const convert = converters[col];
                    record[names[col]] = convert === null
                        ? columns[col][row]
                        : convert(columns[col][row]);
                }
                if (record._key === undefined) throw new Error('bad row');
                seen++;
            }
        }
    } finally {
        conn.disconnectSync();
    }
    return seen;
}

/** `null` means "no conversion needed" - the common case, and the whole point. */
function converterFor(values) {
    let sample;
    for (const value of values) {
        if (value != null) {
            sample = value;
            break;
        }
    }
    if (sample == null) return null;
    if (typeof sample === 'bigint') return Number;
    if (typeof sample !== 'object') return null;
    return plain;
}

const t1 = process.hrtime.bigint();
const seen1 = await streamRowObjects('SELECT * FROM t');
const ms1 = since(t1);
note(`1. rows() as today            ${`${ms1.toFixed(0)} ms`.padStart(10)}  ${rate(seen1, ms1).padStart(14)}`);

const t2 = process.hrtime.bigint();
const seen2 = await streamRowObjectsFast('SELECT * FROM t');
const ms2 = since(t2);
note(`2. rows() per-column converters${`${ms2.toFixed(0)} ms`.padStart(9)}  ${rate(seen2, ms2).padStart(14)}`
    + `   ${(ms1 / ms2).toFixed(1)}x faster`);

// ---------------------------------------------------------------- 3-5. DuckDB writes it
async function copyTo(label, file, options) {
    const target = out(file);
    const start = process.hrtime.bigint();
    await connection.run(`COPY (SELECT * FROM t) TO '${target}' (${options})`);
    const ms = since(start);
    note(`${label.padEnd(30)}${`${ms.toFixed(0)} ms`.padStart(10)}  ${rate(ROWS, ms).padStart(14)}`
        + `   ${mb(target)} MB   ${(ms1 / ms).toFixed(0)}x faster than rows()`);
    return ms;
}

await copyTo('3. COPY -> ldjson', 'out.ndjson', 'FORMAT JSON');
await copyTo('4. COPY -> CSV', 'out.csv', 'FORMAT CSV, HEADER');
await copyTo('5. COPY -> Parquet+zstd', 'out.parquet', 'FORMAT PARQUET, COMPRESSION zstd');

// ---------------------------------------------------------------- 6. ldjson built in JS
const t6 = process.hrtime.bigint();
{
    const target = out('js.ndjson');
    const handle = fs.openSync(target, 'w');
    let buffer = '';
    let written = 0;
    const conn = await instance.connect();
    const result = await conn.stream('SELECT * FROM t');
    const names = result.columnNames();
    for (;;) {
        const chunk = await result.fetchChunk();
        if (chunk == null || chunk.rowCount === 0) break;
        const columns = names.map((_n, i) => chunk.getColumnValues(i));
        for (let row = 0; row < chunk.rowCount; row++) {
            const record = Object.fromEntries(
                names.map((name, col) => [name, plain(columns[col][row])])
            );
            buffer += `${JSON.stringify(record)}\n`;
            if (buffer.length > 1 << 20) {
                fs.writeSync(handle, buffer);
                written += buffer.length;
                buffer = '';
            }
        }
    }
    if (buffer) {
        fs.writeSync(handle, buffer); written += buffer.length;
    }
    fs.closeSync(handle);
    conn.disconnectSync();
    const ms = since(t6);
    note(`6. ldjson built in JS         ${`${ms.toFixed(0)} ms`.padStart(10)}  ${rate(ROWS, ms).padStart(14)}`
        + `   ${(written / 1024 / 1024).toFixed(1)} MB`);
}

// ------------------------------------ 7/8. the slicer idea: N connections, N ranges
/**
 * Partitioned by a RANGE on the ordered key, not `OFFSET`.
 *
 * `LIMIT/OFFSET` would make every partition scan and discard everything before it - partition 5
 * pays for partitions 0-4 - so N slices would cost O(N^2). A range predicate on an ordered
 * integer key is a cheap zone-map skip, and concatenating the parts in partition order
 * reproduces the original order exactly.
*/
function ranges(parts) {
    const per = Math.ceil(ROWS / parts);
    return Array.from({ length: parts }, (_unused, n) => (
        `SELECT * FROM t WHERE id >= ${n * per} AND id < ${(n + 1) * per}`
    ));
}

const PARTS = Number(process.env.PARTS || 5);

heading(`the slicer idea: ${PARTS} connections, ${PARTS} ranges`);

// 7. each partition written by DuckDB to its own part file, concurrently
{
    const start = process.hrtime.bigint();
    await Promise.all(ranges(PARTS).map(async (sql, n) => {
        const conn = await instance.connect();
        try {
            await conn.run(`COPY (${sql}) TO '${out(`part-${n}.ndjson`)}' (FORMAT JSON)`);
        } finally {
            conn.disconnectSync();
        }
    }));
    const ms = since(start);
    const bytes = Array.from({ length: PARTS }, (_u, n) => fs.statSync(out(`part-${n}.ndjson`)).size)
        .reduce((a, b) => a + b, 0);
    note(`7. ${PARTS}x COPY -> ldjson parts  ${`${ms.toFixed(0)} ms`.padStart(10)}`
        + `  ${rate(ROWS, ms).padStart(14)}   ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}

// 8. the same partitioning, but converted in JS - the case for "more connections make rows() faster"
{
    const start = process.hrtime.bigint();
    const counts = await Promise.all(ranges(PARTS).map((sql) => streamRowObjectsFast(sql)));
    const ms = since(start);
    const total = counts.reduce((a, b) => a + b, 0);
    note(`8. ${PARTS}x rows() concurrently   ${`${ms.toFixed(0)} ms`.padStart(10)}`
        + `  ${rate(total, ms).padStart(14)}   vs ${ms2.toFixed(0)} ms single`);
    note('   (JS conversion is single-threaded, so extra connections interleave on ONE thread)');
}

heading('What this means');
note('If the result is destined for a FILE - ldjson or CSV to S3 - DuckDB should write it.');
note('Nothing crosses into JS, so it is not bounded by single-threaded value conversion.');
note('`rows()` is only the right answer when JS objects are genuinely the product.');

connection.disconnectSync();
instance.closeSync();
fs.rmSync(dir, { recursive: true, force: true });
