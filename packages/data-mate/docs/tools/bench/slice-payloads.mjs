/**
 * REAL slice sizes: the search API caps a slice at 100k records, and 10k-50k is common.
 *
 * **The constraint that makes this bench necessary.** DuckDB's default Parquet row group is
 * **122,880 rows**, and §THE ROW GROUP IS THE UNIT established that query cost is ~32-45 microseconds
 * per row group with file count absent from the law. The recorded design rule that followed was
 * "size payloads to at least one full row group".
 *
 * **That rule is UNACHIEVABLE here.** The producer cannot emit a payload bigger than 100k rows,
 * because `qpl-search-api` cannot return more than that in one slice. Every single payload is
 * therefore an UNDER-FILLED row group, and at 10k-50k it is under-filled by 2.5-12x. A file per slice
 * means one under-filled row group per slice, and a long job makes tens of thousands of them:
 *
 *     1B rows / 50k per slice = 20,000 payloads = 20,000 row groups
 *     20,000 x ~35 us = ~700 ms of pure metadata tax on EVERY query
 *
 * So the question is not "how big should a payload be" - that is fixed by the API - but **whether the
 * worker should STITCH payloads together, how often, and what stitching costs**.
 *
 * **The floor nobody can go below.** Stitching cannot produce fewer than `total_rows / 122,880` row
 * groups. At 1B that is 8,138 groups no matter what. So stitching converts a per-PAYLOAD tax into a
 * per-ROW-GROUP one, which for 50k slices is a 2.5x reduction and for 10k slices a 12x reduction.
 *
 * Variants, at each realistic slice size:
 *
 *   | variant | what it is |
 *   |---|---|
 *   | `raw payloads` | one file per slice, queried as a view — what ships today |
 *   | `stitched` | payloads combined into files of >= one full row group |
 *   | `one big file` | every payload merged into a SINGLE Parquet file |
 *   | `real table` | `CREATE TABLE AS`, for the upper bound |
 *
 * **`one big file` is the variant no previous bench covered.** `parquet-query.mjs` swept file counts
 * down to 10 and `storage-formats.mjs` used one file per format but never against many-file
 * alternatives at slice-realistic sizes. It matters because it separates "fewer files" from "fuller
 * row groups" one more time: a single 20M-row file still holds ~163 row groups, so if the law holds it
 * should cost the SAME as 163 stitched files — and if it does, file count is confirmed irrelevant one
 * final time.
 *
 * Every variant censuses its actual row groups with `parquet_metadata_file`, and every predicate
 * prints what it matches, because both of those have caught real bugs here.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/slice-payloads.mjs
 *   TOTAL=50000000 PER=10000,50000,100000 node .../slice-payloads.mjs
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir, stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const TOTAL = Number(process.env.TOTAL || 20_000_000);
const PERS = (process.env.PER || '10000,50000,100000').split(',').map(Number);
const REPEATS = Number(process.env.REPEATS || 4);
const SPOOL = process.env.SPOOL || '/tmp/duck-slice-spool';
/** DuckDB's default Parquet row group. The whole point of this file. */
const ROW_GROUP = 122_880;

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const QUERIES = [
    ['count(*)', 'SELECT count(*) FROM {T}'],
    ['selective filter', `SELECT count(*) FROM {T} WHERE "active" = true AND "category" = 'gamma'`],
    ['range + eq', `SELECT count(*) FROM {T} WHERE "amount" BETWEEN 100 AND 500 AND "status" = 'active'`],
    ['agg: 1 key', `SELECT "category", count(*), sum("amount") FROM {T} GROUP BY 1`],
    ['top 100 rows', 'SELECT * FROM {T} WHERE "active" = true ORDER BY "amount" DESC LIMIT 100'],
    ['project 1 col', 'SELECT sum("amount") FROM {T}'],
];

const sqlList = (paths) => `[${paths.map((p) => `'${p}'`).join(', ')}]`;

async function dirBytes(dir) {
    let total = 0;
    for (const f of await readdir(dir)) total += (await stat(join(dir, f))).size;
    return total;
}

/* ------------------------------------------------------------------ corpus */

await rm(SPOOL, { recursive: true, force: true });
await mkdir(SPOOL, { recursive: true });

heading(`SLICE PAYLOADS — ${num(TOTAL)} rows, row group is ${num(ROW_GROUP)}`);
note(`  the search API caps a slice at 100,000 rows, so EVERY payload is an under-filled row group`);

const finest = Math.min(...PERS);
const rawDir = join(SPOOL, `raw${finest}`);
await mkdir(rawDir, { recursive: true });

const genStart = performance.now();
const finestPaths = [];
let written = 0;
while (written < TOTAL) {
    const take = Math.min(finest, TOTAL - written);
    const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(take, written + 1), {
        name: `g${finestPaths.length}`,
    });
    const path = join(rawDir, `p${String(finestPaths.length).padStart(6, '0')}.parquet`);
    await frame.writeParquet(path);
    await frame.destroy();
    finestPaths.push(path);
    written += take;
}
note(`  generated ${num(TOTAL)} rows as ${num(finestPaths.length)} payloads of ${num(finest)}`
    + ` in ${((performance.now() - genStart) / 1000).toFixed(1)}s`);

const instance = await DuckDBInstance.create(':memory:');
const c = await instance.connect();
const run = async (sql) => (await c.runAndReadAll(sql)).getRows();
await c.run(`SET checkpoint_threshold = '1TB'`);

/** Count row groups for real - never infer them from the requested size. */
async function census(paths) {
    const rows = await run(
        `SELECT sum(num_row_groups), count(*) FROM parquet_file_metadata(${sqlList(paths)})`
    );
    return { groups: Number(rows[0][0]), files: Number(rows[0][1]) };
}

/**
 * Merge `paths` into files of at least `rowsPerOut` rows.
 *
 * This IS the stitch operation the worker would run, expressed the only way that refills row groups:
 * a DuckDB-side `COPY` of several payloads into one file, which rewrites at the default 122,880.
 */
async function stitch(paths, perOut, outDir, label) {
    await mkdir(outDir, { recursive: true });
    const groupSize = Math.max(1, Math.round(perOut / (TOTAL / paths.length)));
    const out = [];
    const start = performance.now();
    for (let i = 0; i < paths.length; i += groupSize) {
        const batch = paths.slice(i, i + groupSize);
        const path = join(outDir, `s${String(out.length).padStart(6, '0')}.parquet`);
        await c.run(`COPY (SELECT * FROM read_parquet(${sqlList(batch)})) TO '${path}' (FORMAT parquet, COMPRESSION zstd)`);
        out.push(path);
    }
    const ms = performance.now() - start;
    note(`  ${label}: ${num(paths.length)} -> ${num(out.length)} files in ${(ms / 1000).toFixed(1)}s`);
    return { paths: out, ms };
}

async function battery(relation) {
    const out = {};
    for (const [name, sql] of QUERIES) {
        const samples = [];
        for (let i = 0; i < REPEATS; i++) {
            const start = performance.now();
            await run(sql.replace('{T}', relation));
            samples.push(performance.now() - start);
        }
        out[name] = median(samples.slice(1));
    }
    return out;
}

heading('WHAT EACH PREDICATE MATCHES');
for (const [name, sql] of QUERIES) {
    if (name === 'count(*)' || name.startsWith('agg') || name.startsWith('project')) continue;
    const counted = sql.replace(/^SELECT .*? FROM/, 'SELECT count(*) FROM').replace(/ ORDER BY .*$/, '');
    const n = Number((await run(counted.replace('{T}', `read_parquet(${sqlList(finestPaths.slice(0, 20))})`)))[0][0]);
    note(`  ${name.padEnd(20)} ${n === 0 ? '<-- ZERO ROWS, the query is meaningless' : `${num(n)} of ${num(finest * 20)} sampled`}`);
}

/* ------------------------------------------------------------------ variants */

const rows = [];

for (const per of PERS) {
    heading(`PAYLOADS OF ${num(per)} ROWS — ${num(Math.ceil(TOTAL / per))} of them`);

    let paths = finestPaths;
    if (per !== finest) {
        ({ paths } = await stitch(finestPaths, per, join(SPOOL, `raw${per}`), `regroup to ${num(per)}-row payloads`));
    }

    const rawCensus = await census(paths);
    note(`  raw: ${num(rawCensus.files)} files, ${num(rawCensus.groups)} row groups`
        + ` (${(rawCensus.groups / rawCensus.files).toFixed(2)} per file, ${num(TOTAL / rawCensus.groups)} rows each)`);
    rows.push({ per, variant: 'raw payloads', ...rawCensus, stitchMs: 0, q: await battery(`read_parquet(${sqlList(paths)})`) });

    // stitched to at least one full row group per output file
    const st = await stitch(paths, ROW_GROUP, join(SPOOL, `st${per}`), 'stitch to one row group');
    const stCensus = await census(st.paths);
    note(`  stitched: ${num(stCensus.files)} files, ${num(stCensus.groups)} row groups`);
    rows.push({ per, variant: 'stitched', ...stCensus, stitchMs: st.ms, q: await battery(`read_parquet(${sqlList(st.paths)})`) });

    // ONE file, the variant no earlier bench covered
    const big = await stitch(paths, TOTAL, join(SPOOL, `big${per}`), 'merge into ONE file');
    const bigCensus = await census(big.paths);
    note(`  one big file: ${num(bigCensus.files)} file, ${num(bigCensus.groups)} row groups,`
        + ` ${mb(await dirBytes(join(SPOOL, `big${per}`)))}`);
    rows.push({ per, variant: 'one big file', ...bigCensus, stitchMs: big.ms, q: await battery(`read_parquet(${sqlList(big.paths)})`) });

    if (per === PERS[0]) {
        const tStart = performance.now();
        await c.run(`CREATE OR REPLACE TABLE t AS SELECT * FROM read_parquet(${sqlList(paths)})`);
        const tMs = performance.now() - tStart;
        note(`  real table built in ${(tMs / 1000).toFixed(1)}s`);
        rows.push({ per, variant: 'real table', files: 0, groups: 0, stitchMs: tMs, q: await battery('t') });
    }

    await rm(join(SPOOL, `st${per}`), { recursive: true, force: true });
    await rm(join(SPOOL, `big${per}`), { recursive: true, force: true });
    if (per !== finest) await rm(join(SPOOL, `raw${per}`), { recursive: true, force: true });
}

/* ------------------------------------------------------------------ report */

heading('RESULTS — warm ms');
console.log(`    ${'payload'.padEnd(10)}${'variant'.padEnd(15)}${'files'.padStart(8)}${'groups'.padStart(9)}`
    + `${'stitch'.padStart(9)}${QUERIES.map(([n]) => n.slice(0, 15).padStart(17)).join('')}`);
for (const r of rows) {
    console.log(`    ${num(r.per).padEnd(10)}${r.variant.padEnd(15)}`
        + `${(r.files ? num(r.files) : '-').padStart(8)}${(r.groups ? num(r.groups) : '-').padStart(9)}`
        + `${(r.stitchMs ? `${(r.stitchMs / 1000).toFixed(1)}s` : '-').padStart(9)}`
        + QUERIES.map(([n]) => r.q[n].toFixed(1).padStart(17)).join(''));
}

heading('DOES THE ROW-GROUP LAW STILL HOLD? — us per row group, count(*)');
for (const r of rows) {
    if (!r.groups) continue;
    note(`  ${num(r.per).padEnd(10)} ${r.variant.padEnd(15)} ${num(r.groups).padStart(8)} groups`
        + ` -> ${(r.q['count(*)'] * 1000 / r.groups).toFixed(1)} us/group`);
}

heading('WHAT STITCHING BOUGHT, PER PAYLOAD SIZE');
for (const per of PERS) {
    const raw = rows.find((r) => r.per === per && r.variant === 'raw payloads');
    const st = rows.find((r) => r.per === per && r.variant === 'stitched');
    const big = rows.find((r) => r.per === per && r.variant === 'one big file');
    const tot = (r) => QUERIES.reduce((a, [n]) => a + r.q[n], 0);
    note(`  ${num(per)}-row payloads: battery ${tot(raw).toFixed(0)} ms raw`
        + ` -> ${tot(st).toFixed(0)} ms stitched (${(tot(raw) / tot(st)).toFixed(2)}x)`
        + ` -> ${tot(big).toFixed(0)} ms one file (${(tot(raw) / tot(big)).toFixed(2)}x),`
        + ` stitch cost ${(st.stitchMs / 1000).toFixed(1)}s`);
}

c.disconnectSync();
instance.closeSync();
await rm(SPOOL, { recursive: true, force: true });
await closeDuckDatabase();
process.exit(0);
