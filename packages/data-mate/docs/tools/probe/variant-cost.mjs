/* eslint-disable no-console -- a probe: its whole output is the report */
// VARIANT vs JSON text for `Any` / untyped-`Object` fields, ingest done via SQL.
//
// The Node binding cannot WRITE a VARIANT (DataChunk writes segfault, setItem throws - see
// variant-chunk-nulls.mjs), so VARIANT has to be produced in SQL. The shapes compared, on the
// qpl-search-api path (JS records -> DuckDB table -> COPY to Parquet+zstd):
//
//   A  JSON       DataChunk of JSON text into a JSON column (the status quo)
//   B  VARIANT    the same DataChunk into a JSON STAGING table, then CREATE TABLE AS j::VARIANT
//   C  VARIANT    NDJSON text written to a file, read_ndjson_objects(...)::VARIANT
//
// Worker side, every query reads the PARQUET file in place, as the worker does.
//
//   node docs/tools/probe/variant-cost.mjs [scratch-dir]      (from packages/data-mate)
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DuckDBInstance, DuckDBDataChunk } from '@duckdb/node-api';

const DIR = process.argv[2] ?? join(tmpdir(), 'variant-cost');
mkdirSync(DIR, { recursive: true });
const RUNS = 5;
const SIZES = [100_000, 1_000_000];
const CHUNK = 2048;
const CITIES = Array.from({ length: 20 }, (_, i) => `city-${i}`);

/** JSON.stringify, but a BigInt is written as its exact digits rather than throwing. */
function exactJSON(value) {
    return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? `@@${v}@@` : v))
        .replace(/"@@(-?\d+)@@"/g, '$1');
}

function objectRecord(i) {
    return {
        id: i,
        name: `user-${i % 1000}`,
        city: CITIES[i % 20],
        score: (i % 10_000) * 0.37,
        count: i % 97,
        active: i % 2 === 0,
        meta: { source: `api-${i % 5}`, depth: i % 7 },
        tags: [`t${i % 3}`, `t${i % 11}`],
    };
}

/** Every 4th row a scalar - alternately a string and a number - the rest objects. */
function heteroRecord(i) {
    if (i % 4 === 0) return (i % 8 === 0) ? `scalar-${i % 50}` : i % 1000;
    return objectRecord(i);
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const ms = (t0) => Number(process.hrtime.bigint() - t0) / 1e6;
const fmt = (n) => (n >= 100 ? n.toFixed(0) : n.toFixed(1));
const mib = (b) => (b / 1048576).toFixed(2);

async function openFileDb(name) {
    const path = join(DIR, `${name}.duckdb`);
    rmSync(path, { force: true });
    rmSync(`${path}.wal`, { force: true });
    // a file-backed database defaults to storage v1.0.0, which REFUSES a VARIANT column:
    // "VARIANT columns are not supported in storage versions prior to v1.5.0"
    const instance = await DuckDBInstance.create(path, { storage_compatibility_version: 'v1.5.0' });
    return { instance, conn: await instance.connect(), path };
}

async function appendText(conn, table, texts) {
    const types = (await conn.run(`SELECT * FROM ${table} LIMIT 0`)).columnTypes();
    const appender = await conn.createAppender(table);
    for (let off = 0; off < texts.length; off += CHUNK) {
        const win = texts.slice(off, off + CHUNK);
        const chunk = DuckDBDataChunk.create(types, win.length);
        chunk.setColumns([win.map((_, k) => off + k), win]);
        appender.appendDataChunk(chunk);
    }
    appender.flushSync();
    appender.closeSync();
}

/** One ingest of `records` with a shape, into a FRESH file-backed database. */
async function ingest(shape, records, tag) {
    const db = await openFileDb(`${shape}-${tag}`);
    const { conn } = db;
    const t0 = process.hrtime.bigint();
    if (shape === 'A') {
        const texts = records.map(exactJSON);
        await conn.run('CREATE TABLE t (i INTEGER, v JSON)');
        await appendText(conn, 't', texts);
    } else if (shape === 'B') {
        const texts = records.map(exactJSON);
        await conn.run('CREATE TEMP TABLE staging (i INTEGER, v JSON)');
        await appendText(conn, 'staging', texts);
        await conn.run('CREATE TABLE t AS SELECT i, v::VARIANT AS v FROM staging');
        await conn.run('DROP TABLE staging');
    } else {
        const file = join(DIR, `c-${tag}.ndjson`);
        writeFileSync(file, `${records.map(exactJSON).join('\n')}\n`);
        await conn.run(`CREATE TABLE t AS SELECT (row_number() OVER () - 1)::INTEGER AS i, json::VARIANT AS v
            FROM read_ndjson_objects('${file}')`);
    }
    const ingestMs = ms(t0);

    const tc = process.hrtime.bigint();
    await conn.run('CHECKPOINT');
    const checkpointMs = ms(tc);
    const dbBytes = statSync(db.path).size;

    const parquet = join(DIR, `${shape}-${tag}.parquet`);
    const tp = process.hrtime.bigint();
    await conn.run(`COPY (SELECT * FROM t ORDER BY i) TO '${parquet}' (FORMAT parquet, COMPRESSION zstd)`);
    const copyMs = ms(tp);
    const parquetBytes = statSync(parquet).size;
    conn.closeSync();
    db.instance.closeSync();
    return {
        ingestMs, checkpointMs, copyMs, dbBytes, parquetBytes, parquet
    };
}

/** Worker-side query texts per column kind. Every one aggregates over every row. */
function queries(kind, src) {
    const key = (k) => (kind === 'json' ? `(v->>'${k}')` : `variant_extract(v, '${k}')::VARCHAR`);
    const nested = kind === 'json'
        ? `(v->'meta'->>'depth')`
        : `variant_extract(variant_extract(v, 'meta'), 'depth')::VARCHAR`;
    const render = kind === 'json' ? 'v::VARCHAR' : 'v::JSON::VARCHAR';
    return {
        'filter top key': `SELECT count(*) FROM ${src} WHERE TRY_CAST(${key('count')} AS BIGINT) > 48`,
        'filter nested key': `SELECT count(*) FROM ${src} WHERE TRY_CAST(${nested} AS BIGINT) > 3`,
        'group-by string key': `SELECT sum(n * strlen(coalesce(c, '~'))), count(*) FROM
            (SELECT ${key('city')} c, count(*) n FROM ${src} GROUP BY 1)`,
        'render to JSON text': `SELECT sum(strlen(${render})), sum(hash(${render}) % 1000003) FROM ${src}`,
    };
}

async function timeQueries(conn, kind, parquet) {
    const src = `read_parquet('${parquet}')`;
    const out = {};
    for (const [label, sql] of Object.entries(queries(kind, src))) {
        const first = await conn.runAndReadAll(sql); // warm-up, and the result to compare
        const times = [];
        for (let r = 0; r < RUNS; r++) {
            const t0 = process.hrtime.bigint();
            await conn.runAndReadAll(sql);
            times.push(ms(t0));
        }
        out[label] = { ms: median(times), result: JSON.stringify(first.getRowsJson()) };
    }
    return out;
}

async function correctness(conn) {
    const special = [
        { big: 9007199254740993n, neg: -9223372036854775808n, max: 9223372036854775807n },
        { nested: { deep: [1, 2, { k: null }] }, n: null },
        {},
        [],
        [1, 'mixed', false, null],
        'plain',
        12,
        -3.5,
        true,
        { unicode: 'é中😀', quote: 'a"b\\c', nl: 'x\ny' },
        { score: 0.1 + 0.2, small: 1e-7, large: 1.5e300, int_double: 3700 * 0.37 },
        objectRecord(123_457),
    ];
    const reference = special.map(exactJSON);
    const a = await ingest('A', special, 'special');
    const b = await ingest('B', special, 'special');
    const read = async (file, kind) => (await conn.runAndReadAll(
        `SELECT ${kind === 'json' ? 'v::VARCHAR' : 'v::JSON::VARCHAR'} FROM read_parquet('${file}') ORDER BY i`
    )).getRows().map((r) => r[0]);
    const ja = await read(a.parquet, 'json');
    const jb = await read(b.parquet, 'variant');
    console.log('\n### correctness: JSON text read back from Parquet (A = JSON col, B = VARIANT via staging)');
    special.forEach((_, k) => {
        const mark = (x) => (x === reference[k] ? 'ok  ' : 'DIFF');
        console.log(`  A ${mark(ja[k])} B ${mark(jb[k])}  ref=${reference[k]}`);
        if (ja[k] !== reference[k]) console.log(`        A=${ja[k]}`);
        if (jb[k] !== reference[k]) console.log(`        B=${jb[k]}`);
    });
}

async function main() {
    const qi = await DuckDBInstance.create(':memory:');
    const qc = await qi.connect();
    const [[threads]] = (await qc.runAndReadAll('SELECT current_setting(\'threads\')')).getRows();
    const [[version]] = (await qc.runAndReadAll('SELECT version()')).getRows();
    console.log(`duckdb ${version}, threads=${threads}, runs=${RUNS} (median), dir=${DIR}`);

    await correctness(qc);

    for (const [dataset, gen] of [['objects', objectRecord], ['hetero', heteroRecord]]) {
        for (const n of SIZES) {
            const records = Array.from({ length: n }, (_, i) => gen(i));
            console.log(`\n### ${dataset}, ${n.toLocaleString()} rows`);
            const summary = {};
            for (const shape of ['A', 'B', 'C']) {
                const runs = [];
                let last;
                try {
                    for (let r = 0; r < RUNS; r++) {
                        last = await ingest(shape, records, `${dataset}-${n}-${r}`);
                        runs.push(last);
                    }
                } catch (err) {
                    console.log(`  ${shape}: FAILED ${String(err.message).split('\n')[0]}`);
                    continue;
                }
                const q = await timeQueries(qc, shape === 'A' ? 'json' : 'variant', last.parquet);
                summary[shape] = {
                    ingest: median(runs.map((x) => x.ingestMs)),
                    checkpoint: median(runs.map((x) => x.checkpointMs)),
                    copy: median(runs.map((x) => x.copyMs)),
                    dbBytes: last.dbBytes,
                    parquetBytes: last.parquetBytes,
                    q,
                };
            }
            printSummary(summary);
        }
    }
    process.exit(0);
}

function printSummary(summary) {
    const shapes = Object.keys(summary);
    const row = (label, f) => console.log(`  ${label.padEnd(26)}${shapes.map((s) => `${s}: ${f(summary[s])}`.padEnd(22)).join('')}`);
    row('ingest ms', (x) => fmt(x.ingest));
    row('CHECKPOINT ms', (x) => fmt(x.checkpoint));
    row('COPY parquet ms', (x) => fmt(x.copy));
    row('producer total ms', (x) => fmt(x.ingest + x.checkpoint + x.copy));
    row('db file MiB', (x) => mib(x.dbBytes));
    row('parquet+zstd MiB', (x) => mib(x.parquetBytes));
    const labels = Object.keys(summary[shapes[0]].q);
    for (const l of labels) row(`q: ${l} ms`, (x) => fmt(x.q[l].ms));
    for (const l of labels) {
        const results = shapes.map((s) => summary[s].q[l].result);
        const same = results.every((r) => r === results[0]);
        console.log(`  result equal across shapes [${l}]: ${same ? 'yes' : `NO ${shapes.map((s, k) => `${s}=${results[k]}`).join(' ')}`}`);
    }
}

await main();
