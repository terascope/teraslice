/**
 * TRANSFORM QUERIES — all-SQL, mixed SQL+UDF, and all-UDF, crossed with COMPRESSION and STORAGE.
 *
 * Written for the boss-facing report (2026-08-25), and it closes the gap that `HANDOFF.md`
 * "what to run next" ranks first.
 *
 * **Why this run is not optional.** Every recorded promotion number - 8.87x on `isIP`, 2.98x on the
 * five-function pipeline - was measured on an **UNCOMPRESSED** table, which is the state right after
 * ingest. The settled recipe checkpoints at quiesce, so production queries a **COMPRESSED** one, and
 * on a compressed column a JS UDF runs **once per DISTINCT value** rather than once per row. If
 * compression collapses the UDF cost, the headline promotion win is overstated - the same failure
 * mode as the withdrawn "18x": a ratio measured on a configuration nobody runs.
 *
 * So the axes are:
 *
 *   pipeline  x  all SQL  |  mixed (3 SQL + 2 UDF)  |  all UDF
 *   storage   x  native table UNCOMPRESSED  |  native table COMPRESSED  |  parquet view
 *   shape     x  projection (five transforms forced)  |  transform + filter + group by
 *
 * **`preferSql: false` forces the UDF path for a function that HAS an emission.** That is
 * deliberate: it isolates the EXECUTION PATH rather than confounding it with a different function.
 * In production the mix arises instead from the 17 functions that are not promoted - same shape,
 * same cost, reached a different way.
 *
 * **Forcing the work.** A transform projection wrapped in `count(*)` is DISCARDED by the optimiser -
 * it once reported 500k rows in 0 ms at 1.5 billion rows/s, having built no strings at all. Every
 * shape here ends in `sum(strlen(...))` over each transformed column, which cannot be elided.
 *
 * Run (serially - never two DuckDB benches at once):
 *   node packages/data-mate/docs/tools/bench/report-transforms.mjs
 *   SCALES=1000000 node .../report-transforms.mjs
 */
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckFrame, heading, note } from '../lib/duck.mjs';

const SCALES = (process.env.SCALES || '1000000,10000000').split(',').map(Number);
const GEN_CHUNK = Number(process.env.GEN_CHUNK || 100_000);
const REPEATS = Number(process.env.REPEATS || 3);
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '24GiB';
const ROOT = process.env.ROOT || '/tmp/duck-transforms';
const OUT = process.env.OUT || new URL('../results/transforms.json', import.meta.url).pathname;

const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);
const { duckFrameAdapter } = await import(
    new URL('../../../dist/src/adapters/duck-frame-adapter/index.js', import.meta.url)
);
const { functionConfigRepository } = await import(
    new URL('../../../dist/src/function-configs/index.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** The same five transforms the comparison harness's composed-pipeline case uses. */
const STEPS = [
    ['toUpperCase', 'category'],
    ['toLowerCase', 'status'],
    ['trim', 'name'],
    ['toUpperCase', 'email'],
    ['trim', 'description'],
];

/** Which STEPS indexes are forced onto the UDF path, per pipeline. */
const PIPELINES = [
    ['all SQL', new Set()],
    ['mixed 3 SQL + 2 UDF', new Set([1, 3])],
    ['all UDF', new Set([0, 1, 2, 3, 4])],
];

/**
 * Build the five expressions for one pipeline.
 *
 * `duckFrameAdapter` REGISTERS the UDF as a side effect when it returns one, keyed to `database`,
 * so the database has to be the one the query will run on. Registration is instance-wide, which is
 * what makes a UDF visible to the private connection a stream opens.
 */
async function expressionsFor(database, udfIndexes) {
    const out = [];
    for (const [index, [fn, field]] of STEPS.entries()) {
        const adapted = await duckFrameAdapter(functionConfigRepository[fn], {
            field,
            inputConfig: { field_config: CONFIG.fields[field] },
            database,
            preferSql: udfIndexes.has(index) ? false : undefined,
        });
        out.push({ fn, field, expression: adapted.expression, isUdf: udfIndexes.has(index) });
    }
    return out;
}

/** Two query shapes, both ending in something the optimiser cannot discard. */
function shapes(exprs, source) {
    const forced = exprs.map((e) => `strlen(${e.expression})`).join(' + ');
    return [
        ['projection (5 transforms)', `SELECT sum(${forced}) FROM ${source}`],
        ['transform + filter + group', `SELECT "category", sum(${forced}) FROM ${source}`
            + ` WHERE "active" = true AND "amount" BETWEEN 100 AND 5000 GROUP BY 1`],
    ];
}

async function timeIt(frame, sql, repeats) {
    const samples = [];
    for (let i = 0; i < repeats; i++) {
        const start = performance.now();
        await frame.query(sql);
        samples.push(performance.now() - start);
    }
    const rest = samples.slice(1);
    return rest.length ? median(rest) : samples[0];
}

async function segments(frame, table) {
    const rows = await frame.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}') GROUP BY 1 ORDER BY 2 DESC`
    );
    const counts = rows.map((r) => [String(r[0]), Number(r[1])]);
    const all = counts.reduce((a, [, n]) => a + n, 0);
    return { all, uncompressed: counts.find(([k]) => k === 'Uncompressed')?.[1] ?? 0 };
}

/* ------------------------------------------------------------------ run */

heading('TRANSFORMS — SQL vs mixed vs UDF, crossed with compression and storage');
note(`memory_limit=${MEMORY_LIMIT}`);
note('every shape ends in sum(strlen(...)): a transform under count(*) is discarded by the optimiser');

await mkdir(ROOT, { recursive: true });
const all = [];

for (const ROWS of SCALES) {
    heading(`${num(ROWS)} ROWS`);
    const DB = join(ROOT, `t-${ROWS}.db`);
    const PQ = join(ROOT, `t-${ROWS}.parquet`);
    for (const p of [DB, `${DB}.wal`, PQ]) if (existsSync(p)) await rm(p, { force: true });

    const frame = await DuckFrame.create(CONFIG, { name: 'corpus', database: DB });
    const TABLE = frame.table ?? 'corpus';
    await frame.query(`SET memory_limit = '${MEMORY_LIMIT}'`);
    // keep the table UNCOMPRESSED for the first half of the matrix: DuckDB auto-checkpoints at the
    // 16 MiB default, which would silently compress it mid-build and destroy the axis
    await frame.query("SET checkpoint_threshold = '1TB'");

    let built = 0;
    const start = performance.now();
    while (built < ROWS) {
        const take = Math.min(GEN_CHUNK, ROWS - built);
        await frame.append({ records: makeRecords(take, built + 1) });
        built += take;
    }
    note(`built in ${((performance.now() - start) / 1000).toFixed(1)}s`);

    await frame.query(`COPY ${TABLE} TO '${PQ}' (FORMAT parquet, COMPRESSION zstd)`);
    await frame.query(`CREATE OR REPLACE VIEW pq AS SELECT * FROM read_parquet('${PQ}')`);

    const pre = await segments(frame, TABLE);
    note(`table before checkpoint: ${pre.uncompressed} of ${pre.all} segments uncompressed`
        + ` (${((pre.uncompressed / pre.all) * 100).toFixed(0)}%)`);

    const results = [];

    async function sweep(storageLabel, source) {
        for (const [pipeLabel, udfIndexes] of PIPELINES) {
            const exprs = await expressionsFor(DB, udfIndexes);
            const sqlCount = exprs.filter((e) => !e.isUdf).length;
            for (const [shapeLabel, sql] of shapes(exprs, source)) {
                const ms = await timeIt(frame, sql, REPEATS);
                results.push({
                    storage: storageLabel, pipeline: pipeLabel, shape: shapeLabel, ms, sqlCount,
                });
                console.log(`    ${storageLabel.padEnd(24)}${pipeLabel.padEnd(22)}`
                    + `${shapeLabel.padEnd(28)}${`${ms.toFixed(1)} ms`.padStart(11)}`);
            }
        }
    }

    note('');
    console.log(`    ${'storage'.padEnd(24)}${'pipeline'.padEnd(22)}${'shape'.padEnd(28)}${'warm'.padStart(11)}`);
    await sweep('table UNCOMPRESSED', TABLE);
    await sweep('parquet view', 'pq');

    // now compress the table - armed and verified, or a CHECKPOINT can silently do nothing
    await frame.query("SET checkpoint_threshold = '16MB'");
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    const ckStart = performance.now();
    await frame.query('CHECKPOINT');
    const checkpointMs = performance.now() - ckStart;
    const post = await segments(frame, TABLE);
    if (post.uncompressed >= pre.uncompressed && post.uncompressed / post.all > 0.1) {
        throw new Error(`CHECKPOINT did nothing: ${post.uncompressed}/${post.all} still uncompressed`);
    }
    note('');
    note(`CHECKPOINT ${checkpointMs.toFixed(0)} ms - uncompressed ${pre.uncompressed} -> ${post.uncompressed}`
        + ` of ${post.all}`);
    note('');
    await sweep('table COMPRESSED', TABLE);

    /* ---- what the promotion is worth, per storage state ---- */

    note('');
    note('  WHAT THE SQL PROMOTION IS WORTH — all-UDF / all-SQL, per storage state');
    note(`  ${'storage'.padEnd(24)}${'shape'.padEnd(28)}${'all SQL'.padStart(11)}${'mixed'.padStart(11)}${'all UDF'.padStart(11)}${'UDF/SQL'.padStart(10)}`);
    const gains = [];
    for (const storage of ['table UNCOMPRESSED', 'table COMPRESSED', 'parquet view']) {
        for (const shape of ['projection (5 transforms)', 'transform + filter + group']) {
            const pick = (p) => results.find(
                (r) => r.storage === storage && r.pipeline === p && r.shape === shape
            )?.ms;
            const sql = pick('all SQL'); const mixed = pick('mixed 3 SQL + 2 UDF'); const udf = pick('all UDF');
            const gain = udf / sql;
            gains.push({ storage, shape, sql, mixed, udf, gain });
            note(`  ${storage.padEnd(24)}${shape.padEnd(28)}${`${sql.toFixed(1)}`.padStart(11)}`
                + `${`${mixed.toFixed(1)}`.padStart(11)}${`${udf.toFixed(1)}`.padStart(11)}`
                + `${`${gain.toFixed(2)}x`.padStart(10)}`);
        }
    }

    all.push({ rows: ROWS, checkpointMs, segmentsBefore: pre, segmentsAfter: post, results, gains });
    await writeFile(OUT, JSON.stringify({ steps: STEPS, scales: all }, null, 2));
    note(`  results -> ${OUT}`);

    await closeDuckDatabase(DB);
    for (const p of [DB, `${DB}.wal`, PQ]) if (existsSync(p)) await rm(p, { force: true });
}

heading('DONE');
note(`results written to ${OUT}`);
process.exit(0);
