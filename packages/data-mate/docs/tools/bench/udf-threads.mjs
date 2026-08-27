/**
 * Does a transform get FASTER with more cores - and does a JS UDF get any of that?
 *
 * The transform cases are the ones DuckFrame loses at small scale, and every QPL function runs
 * today as a **vectorized scalar UDF**: DuckDB hands a chunk of 2048 values to a JavaScript
 * callback. JavaScript is single-threaded, so the open question is whether DuckDB can still run
 * that projection across cores or whether the UDF serializes the whole pipeline. The answer
 * decides whether "higher concurrency for bulk transforms" is available at all, or whether the
 * only route is emitting SQL instead of calling into JS.
 *
 * So each shape is measured at several `threads` settings, against a pure-SQL control that does
 * the SAME work (`upper`/`lower`/`trim`) with no JS in the loop:
 *
 *   passthrough   write 30 columns unchanged      the write floor
 *   udf x1/x5     1 and 5 columns through the real adapter (a UDF per column)
 *   sql x1/x5     the same columns, as SQL expressions
 *
 *     node packages/data-mate/docs/tools/bench/udf-threads.mjs
 *     ROWS=1000000 THREADS=1,4,14 node .../udf-threads.mjs
*/
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { heading } from '../lib/duck.mjs';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;

const { DuckFrame, configureDuckDatabase, closeDuckDatabase } = await import(
    dist('duck-frame/DuckFrame.js')
);
const { duckFrameAdapter } = await import(dist('adapters/duck-frame-adapter/index.js'));
const { functionConfigRepository: repo } = await import(dist('function-configs/index.js'));

const { CONFIG, COLUMNS, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const ROWS = Number(process.env.ROWS || 500_000);
const RUNS = Number(process.env.RUNS || 3);
const THREAD_COUNTS = (process.env.THREADS || `1,2,4,${os.cpus().length}`)
    .split(',').map(Number);

/** The five columns the `5 transforms + filter` case touches, with their SQL equivalents. */
const STEPS = [
    ['toUpperCase', 'category', (col) => `upper(${col})`],
    ['toLowerCase', 'status', (col) => `lower(${col})`],
    ['trim', 'name', (col) => `trim(${col})`],
    ['toUpperCase', 'email', (col) => `upper(${col})`],
    ['trim', 'description', (col) => `trim(${col})`],
];

heading(`UDF vs SQL vs threads - ${ROWS.toLocaleString()} rows, ${COLUMNS.length} columns`);

const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'base' });

/**
 * The UDF expressions, built ONCE.
 *
 * `duckFrameAdapter` registers the scalar function as a side effect, so building them inside the
 * timing loop would measure registration - and re-registering the same name per run is not what a
 * query does either.
*/
const udf = {};
const fields = { ...CONFIG.fields };
for (const [fn, field] of STEPS) {
    const adapted = await duckFrameAdapter(repo[fn], {
        field,
        inputConfig: { field_config: CONFIG.fields[field] },
    });
    udf[field] = adapted.expression;
    fields[field] = adapted.outputConfig.field_config;
}

const passthrough = (overrides = {}) => {
    const select = {};
    for (const name of COLUMNS) select[name] = `"${name}"`;
    return { ...select, ...overrides };
};

/**
 * Median wall time of RUNS after a discarded warm-up, plus the CPU time the whole process burned.
 *
 * **`cpu / wall` is the effective core count**, and it is the measurement that settles WHY a shape
 * does not scale rather than just showing that it does not. `process.cpuUsage()` counts user+system
 * across every thread in the process, DuckDB's C++ pool included, so a projection that really runs
 * on 14 cores reports ~14 and one that funnels through a single JavaScript callback reports ~1.
*/
async function measure(build) {
    await build();

    const samples = [];
    let cpu = 0;
    let wall = 0;
    for (let n = 0; n < RUNS; n++) {
        const cpuStart = process.cpuUsage();
        const start = performance.now();
        await build();
        const ms = performance.now() - start;
        const used = process.cpuUsage(cpuStart);
        samples.push(ms);
        wall += ms;
        cpu += (used.user + used.system) / 1000;
    }
    samples.sort((a, b) => a - b);
    return { ms: samples[Math.floor(samples.length / 2)], cores: cpu / wall };
}

/** Materialises a projection and drops the result, so only the projection is measured. */
async function project(overrides) {
    const table = await frame.select(passthrough(overrides), { version: 1, fields }).materialize();
    await table.destroy();
}

/**
 * The same expression, aggregated instead of written: `sum(length(expr))`.
 *
 * This separates the FUNCTION from the 30-column table write. `count(*)` would not - the optimiser
 * drops a projection nothing reads - but an aggregate over the expression has to evaluate every
 * value, and returns one row, so nothing is materialised.
*/
async function aggregate(expression) {
    const projected = frame.select(
        { total: `sum(length(${expression}))` },
        { version: 1, fields: { total: { type: 'Long' } } }
    );
    let seen = 0;
    for await (const _row of projected.rows()) seen++;
    return seen;
}

const SHAPES = [
    ['passthrough', () => project({})],
    ['udf x1', () => project({ category: udf.category })],
    ['sql x1', () => project({ category: 'upper("category")' })],
    ['udf x5', () => project(Object.fromEntries(STEPS.map(([, field]) => [field, udf[field]])))],
    ['sql x5', () => project(Object.fromEntries(
        STEPS.map(([, field, sql]) => [field, sql(`"${field}"`)])
    ))],
    // no table write at all: just the function over every value
    ['udf x1 agg', () => aggregate(udf.category)],
    ['sql x1 agg', () => aggregate('upper("category")')],
];

const results = new Map(SHAPES.map(([name]) => [name, []]));

for (const threads of THREAD_COUNTS) {
    await configureDuckDatabase({ threads });
    for (const [name, run] of SHAPES) {
        const sample = await measure(run);
        results.get(name).push(sample);
        // eslint-disable-next-line no-console
        console.log(`  threads=${String(threads).padEnd(3)} ${name.padEnd(12)}`
            + `${sample.ms.toFixed(0).padStart(7)} ms`
            + `${`${sample.cores.toFixed(1)} cores`.padStart(12)}`
            + `  ${Math.round(ROWS / (sample.ms / 1000)).toLocaleString()}/s`);
    }
}

// eslint-disable-next-line no-console
console.log(`\n  ${'shape'.padEnd(12)}${THREAD_COUNTS.map((t) => `t=${t}`.padStart(10)).join('')}`
    + '   scaling, and cores actually used');
for (const [name, samples] of results) {
    const last = samples[samples.length - 1];
    const scaling = (samples[0].ms / last.ms).toFixed(2);
    // eslint-disable-next-line no-console
    console.log(`  ${name.padEnd(12)}${samples.map((s2) => `${s2.ms.toFixed(0)} ms`.padStart(10)).join('')}`
        + `   ${scaling}x scaling, ${last.cores.toFixed(1)} cores at`
        + ` ${THREAD_COUNTS[THREAD_COUNTS.length - 1]} threads`);
}

await frame.destroy();
await closeDuckDatabase();
