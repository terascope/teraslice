/**
 * What does a transform cost if we MUTATE IN PLACE instead of building a new table?
 *
 * The comparison harness forces every transform case with `materialize()` - `CREATE TABLE ... AS
 * SELECT`, all 30 columns - because the `DataFrame` side is eager and needs something comparable.
 * That is a MEASUREMENT choice, not what production does: a real query composes the transform into
 * the one statement that ends in `writeNDJSON`. So there are three separate costs here, and the
 * benchmark only ever showed the most expensive one:
 *
 *   1. EVALUATE      run the UDF over every row, write nothing
 *   2. UPDATE        mutate the one column in place
 *   3. MATERIALIZE   write a whole new 30-column table (what the harness measures)
 *
 * Plus the five-transform versions, since a real pipeline applies several.
 *
 * **Mutating in place is currently a DO-NOT** (docs/HANDOFF.md): relations read their source by
 * name, so an UPDATE silently changes every frame derived from that table. This measures what the
 * rule costs, so the trade is made on numbers. It is safe only when the frame owns its table and
 * nothing else references it - which the handoff notes is decidable statically, because the whole
 * plan is known before execution.
 *
 *     node packages/data-mate/docs/tools/bench/mutate-in-place.mjs
 *     ROWS=1000000 RUNS=5 node .../mutate-in-place.mjs
 */
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { heading, note } from '../lib/duck.mjs';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;

const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { duckFrameAdapter } = await import(dist('adapters/duck-frame-adapter/index.js'));
const { functionConfigRepository: repo } = await import(dist('function-configs/index.js'));

const { CONFIG, COLUMNS, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const ROWS = Number(process.env.ROWS || 500_000);
const RUNS = Number(process.env.RUNS || 3);

/** The five columns the `5 transforms + filter` case touches. */
const STEPS = [
    ['toUpperCase', 'category'],
    ['toLowerCase', 'status'],
    ['trim', 'name'],
    ['toUpperCase', 'email'],
    ['trim', 'description'],
];

heading(`Transform: evaluate vs update-in-place vs materialize - ${ROWS.toLocaleString()} rows`);

const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'base' });
const base = frame.table;
const ctx = frame;

/** The UDF expression for one step, through the real adapter. */
async function expressionFor(fnName, field) {
    const adapted = await duckFrameAdapter(repo[fnName], {
        field,
        inputConfig: { field_config: CONFIG.fields[field] },
    });
    return adapted.expression;
}

const expressions = new Map();
for (const [fnName, field] of STEPS) {
    expressions.set(field, await expressionFor(fnName, field));
}

const quoted = (name) => `"${name}"`;

/** All 30 columns, with the named ones replaced by their transform. */
function projection(fields) {
    return COLUMNS
        .map((name) => (fields.includes(name)
            ? `${expressions.get(name)} AS ${quoted(name)}`
            : quoted(name)))
        .join(', ');
}

/**
 * Times `sql` after resetting the work table, which is NOT timed.
 *
 * The reset matters: `UPDATE` mutates, and DuckDB's MVCC keeps the old row versions, so a second
 * UPDATE on an already-updated table is not measuring the same thing.
 */
async function time(label, sqlFor) {
    const samples = [];

    for (let n = 0; n < RUNS + 1; n++) {
        await ctx.query(`CREATE OR REPLACE TABLE work AS SELECT * FROM ${quoted(base)}`);
        const sql = sqlFor();
        const start = performance.now();
        await ctx.query(sql);
        const ms = performance.now() - start;
        if (n > 0) samples.push(ms);
    }

    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    const rate = Math.round(ROWS / (median / 1000)).toLocaleString();
    note(`${label.padEnd(40)}${median.toFixed(0).padStart(7)} ms${rate.padStart(14)} rows/s`);
    return median;
}

const ONE = ['category'];
const FIVE = STEPS.map(([, field]) => field);

note('\nONE transformed column:');
const evalOne = await time('evaluate only (write nothing)',
    () => `SELECT sum(strlen(${expressions.get('category')})) FROM work`);
const updateOne = await time('UPDATE in place',
    () => `UPDATE work SET ${quoted('category')} = ${expressions.get('category')}`);
const tableOne = await time('materialize a new 30-column table',
    () => `CREATE OR REPLACE TABLE out1 AS SELECT ${projection(ONE)} FROM work`);

note('\nFIVE transformed columns:');
const evalFive = await time('evaluate only (write nothing)',
    () => `SELECT ${FIVE.map((f) => `sum(strlen(${expressions.get(f)}))`).join(', ')} FROM work`);
const updateFive = await time('UPDATE in place, one statement',
    () => `UPDATE work SET ${FIVE.map((f) => `${quoted(f)} = ${expressions.get(f)}`).join(', ')}`);
const tableFive = await time('materialize a new 30-column table',
    () => `CREATE OR REPLACE TABLE out5 AS SELECT ${projection(FIVE)} FROM work`);

note('\nfor reference - what the copy alone costs, no transform at all:');
const copyOnly = await time('CREATE TABLE AS SELECT * (30 columns)',
    () => `CREATE OR REPLACE TABLE out0 AS SELECT * FROM work`);

heading('What it means');
note(`one column:  UPDATE is ${(tableOne / updateOne).toFixed(2)}x the materialize`
    + `, evaluate-only is ${(tableOne / evalOne).toFixed(2)}x`);
note(`five columns: UPDATE is ${(tableFive / updateFive).toFixed(2)}x the materialize`
    + `, evaluate-only is ${(tableFive / evalFive).toFixed(2)}x`);
note(`the 30-column copy alone is ${copyOnly.toFixed(0)} ms, i.e. `
    + `${((copyOnly / tableOne) * 100).toFixed(0)}% of the one-column materialize`
    + ' - that is the part an in-place update skips');

await ctx.query('DROP TABLE IF EXISTS work');
for (const name of ['out0', 'out1', 'out5']) await ctx.query(`DROP TABLE IF EXISTS ${name}`);
await frame.destroy();
await closeDuckDatabase();
