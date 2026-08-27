/**
 * Is a VIEW over `read_parquet` the same as inlining `read_parquet` in the query? And is a GLOB the
 * same as an explicit file list?
 *
 * **Why this exists.** Every Parquet measurement in these docs (`parquet-query.mjs`,
 * `storage-formats.mjs`) creates a `VIEW` and then queries the view. The whole "Parquet as the table"
 * design rests on those numbers. But **nobody ever checked that a view costs the same as inlining the
 * table function**, and "a view is just a stored plan" is exactly the kind of reasonable-sounding
 * claim this project keeps getting burned by. If a view carried any per-query overhead - or, more
 * plausibly, if it AVOIDED some per-query work that inlining repeats - then every recorded view number
 * would be measuring something slightly different from what a caller would actually write.
 *
 * The second question is not cosmetic either. `read_parquet('dir/*.parquet')` has to **resolve the
 * glob**, and a glob is a directory listing. With thousands of payload files that could be a real
 * per-query tax that an explicit path array avoids - or the reverse, if a long IN-list of paths costs
 * more to bind. Nothing here has ever compared them.
 *
 * Variants, all reading the SAME files:
 *
 *   | variant | what the query says |
 *   |---|---|
 *   | `inline list` | `FROM read_parquet(['a.parquet', 'b.parquet', …])` |
 *   | `view list` | `FROM v` where `v` wraps that same array |
 *   | `inline glob` | `FROM read_parquet('dir/*.parquet')` |
 *   | `view glob` | `FROM v` where `v` wraps the glob |
 *   | `table` | `CREATE TABLE AS SELECT * FROM read_parquet(…)`, then `FROM t` |
 *
 * Read the EXPLAIN output first: if the plans are identical the timings must be too, and any
 * difference is measurement noise rather than a finding.
 *
 * Run:
 *   node packages/data-mate/docs/tools/probe/view-vs-inline.mjs
 *   ROWS=5000000 FILES=10,1000 node .../view-vs-inline.mjs
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS || 2_000_000);
const FILES = (process.env.FILES || '10,500').split(',').map(Number);
const REPEATS = Number(process.env.REPEATS || 5);
const SPOOL = process.env.SPOOL || '/tmp/duck-vvi-spool';

const { DuckDBInstance } = await duckdb();
const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** `{T}` is replaced by whatever expression names the data in that variant. */
const QUERIES = [
    ['count(*)', 'SELECT count(*) FROM {T}'],
    ['selective filter', `SELECT count(*) FROM {T} WHERE "active" = true AND "category" = 'gamma'`],
    ['agg: 1 key', `SELECT "category", count(*), sum("amount") FROM {T} GROUP BY 1`],
    ['project 1 col', 'SELECT sum("amount") FROM {T}'],
];

async function generate(rows, files, dir) {
    await mkdir(dir, { recursive: true });
    const perFile = Math.ceil(rows / files);
    const paths = [];
    let written = 0;
    while (written < rows) {
        const take = Math.min(perFile, rows - written);
        const frame = await DuckFrame.fromRecords(
            CONFIG, makeRecords(take, written + 1), { name: `g${paths.length}` }
        );
        const path = join(dir, `p${String(paths.length).padStart(5, '0')}.parquet`);
        await frame.writeParquet(path);
        await frame.destroy();
        paths.push(path);
        written += take;
    }
    return paths;
}

const sqlList = (paths) => `[${paths.map((p) => `'${p}'`).join(', ')}]`;

await rm(SPOOL, { recursive: true, force: true });

for (const fileCount of FILES) {
    const dir = join(SPOOL, `f${fileCount}`);
    const paths = await generate(ROWS, fileCount, dir);
    const glob = `${dir}/*.parquet`;

    heading(`${num(ROWS)} rows over ${fileCount} files`);

    const instance = await DuckDBInstance.create(':memory:');
    const c = await instance.connect();
    const run = async (sql) => (await c.runAndReadAll(sql)).getRows();

    await c.run(`CREATE VIEW v_list AS SELECT * FROM read_parquet(${sqlList(paths)})`);
    await c.run(`CREATE VIEW v_glob AS SELECT * FROM read_parquet('${glob}')`);
    await c.run(`CREATE TABLE t AS SELECT * FROM read_parquet(${sqlList(paths)})`);

    const VARIANTS = [
        ['inline list', `read_parquet(${sqlList(paths)})`],
        ['view list', 'v_list'],
        ['inline glob', `read_parquet('${glob}')`],
        ['view glob', 'v_glob'],
        ['table', 't'],
    ];

    /**
     * **Compare the PLANS before the timings.** If two variants bind to the same plan then any timing
     * difference between them is noise, and reporting it as a finding would be inventing one.
     */
/**
     * Report the OPERATOR SEQUENCE, not a boolean. The first version of this printed
     * `inline == view: false` for every pair, which says nothing about why - and the why turned out
     * to be the finding: a view declared `SELECT * FROM read_parquet(...)` binds an extra
     * **PROJECTION** node that the inline form does not have.
     */
    const operators = (plan) => (plan.match(/[A-Z][A-Z_]{3,}/g) || [])
        .filter((op) => !['READ_PARQUET'].includes(op) || true)
        .filter((op, i, a) => a[i - 1] !== op);

    const plans = {};
    for (const [label, relation] of VARIANTS) {
        for (const [qname, sql] of [['count(*)', 'SELECT count(*) FROM {T}'],
            ['sum(1 col)', 'SELECT sum("amount") FROM {T}']]) {
            const rows = await run(`EXPLAIN ${sql.replace('{T}', relation)}`);
            plans[`${label}|${qname}`] = operators(rows.map((r) => String(r[1])).join('\n')).join(' <- ');
        }
    }
    note('  PLAN SHAPE — read this before any timing below');
    for (const [label] of VARIANTS) {
        for (const qname of ['count(*)', 'sum(1 col)']) {
            note(`    ${label.padEnd(12)} ${qname.padEnd(11)} ${plans[`${label}|${qname}`]}`);
        }
    }

    const results = [];
    for (const [label, relation] of VARIANTS) {
        const row = { label };
        for (const [name, sql] of QUERIES) {
            const samples = [];
            for (let i = 0; i < REPEATS; i++) {
                const start = performance.now();
                await run(sql.replace('{T}', relation));
                samples.push(performance.now() - start);
            }
            row[name] = median(samples.slice(1));
        }
        results.push(row);
    }

    console.log(`\n    ${'variant'.padEnd(14)}${QUERIES.map(([n]) => n.padStart(20)).join('')}`);
    for (const r of results) {
        console.log(`    ${r.label.padEnd(14)}`
            + QUERIES.map(([n]) => r[n].toFixed(2).padStart(20)).join(''));
    }

    const base = results.find((r) => r.label === 'inline list');
    console.log(`\n    as a ratio to \`inline list\` — anything near 1.00 is the same thing:`);
    for (const r of results) {
        console.log(`    ${r.label.padEnd(14)}`
            + QUERIES.map(([n]) => `${(r[n] / base[n]).toFixed(2)}x`.padStart(20)).join(''));
    }

    c.disconnectSync();
    instance.closeSync();
    await rm(dir, { recursive: true, force: true });
}

await rm(SPOOL, { recursive: true, force: true });
await closeDuckDatabase();
process.exit(0);
