/**
 * The FAIR fight: DuckDB's native format with the things only it can do.
 *
 * **Why this exists.** `storage-formats.mjs` concluded Parquet+zstd on every axis, and that conclusion
 * was reached with the native format's two structural advantages switched off:
 *
 *   1. **no INDEX was ever created** — an ART index is native-only, Parquet cannot have one at any
 *      price, and every selective query in that battery therefore ran as a full scan on BOTH sides;
 *   2. **the corpus is SCATTERED**, so min/max zone maps span the whole domain in every row group and
 *      prune nothing. Sorting is the documented 16 s -> 1.6 s lever and had never been tried here.
 *
 * A third omission was in the questions rather than the setup: the battery has **no point lookup**,
 * which is exactly the shape an indexed table wins by orders of magnitude.
 *
 * So this measures native at its best against Parquet at its best. **Sorting helps Parquet too** —
 * row groups carry min/max statistics — so the sorted comparison is not a native-only gift; the index
 * is the only genuinely one-sided capability.
 *
 * **The reporting fix that matters more than any number here.** The shared battery contained two
 * predicates filtering `category = 'cat-3'` and `category IN ('cat-1','cat-3','cat-7')` when the
 * generator produces `alpha/beta/gamma/delta/epsilon`. **They matched zero rows and had done so since
 * the battery was written**, timing scans whose filter never passed anything. Fixed in both benches.
 * To make that class of mistake impossible to repeat, this bench **prints what every predicate
 * actually matches before it times anything** — a zero-match query is then visible in the output
 * rather than hidden inside a plausible millisecond count.
 *
 * Variants:
 *
 *   | variant | what it is | who can do it |
 *   |---|---|---|
 *   | `native` | the table as built | both |
 *   | `native+index` | ART indexes on `_key` (unique) and `name` (100k distinct) | **native only** |
 *   | `native sorted` | rebuilt `ORDER BY amount`, so zone maps prune | both |
 *   | `parquet` | `COPY … zstd` | both |
 *   | `parquet sorted` | `COPY (… ORDER BY amount) … zstd` | both |
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/native-advantages.mjs
 *   ROWS=25000000 node .../native-advantages.mjs
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckFrame, heading, note } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS || 5_000_000);
const GEN_CHUNK = Number(process.env.GEN_CHUNK || 100_000);
const REPEATS = Number(process.env.REPEATS || 4);
const SPOOL = process.env.SPOOL || '/tmp/duck-nat-spool';
const DB = process.env.DB || '/tmp/duck-nat.db';

const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const num = (n) => Math.round(n).toLocaleString();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/**
 * Queries chosen so that each one isolates a DIFFERENT mechanism, because "native is faster" is not
 * a finding — which mechanism makes it faster is.
 *
 * `{T}` is substituted with the relation under test.
 */
const QUERIES = [
    /**
     * An ART index turns this from a full scan into a lookup. Nothing else in any battery does.
     *
     * **`_key` IS NOT UNIQUE.** `makeRecords` emits `key-${i}` with `i` restarting at 0 every call,
     * so with `GEN_CHUNK=100000` there are only 100,000 distinct keys and each repeats once per
     * chunk - 50 times over a 5M corpus. The first draft looked up `key-1234567`, which does not
     * exist at any scale, and measured an index proving ABSENCE (its best case) rather than fetching
     * rows. Caught by the selectivity report below.
     */
    ['point lookup (50 rows)', `SELECT "age" FROM {T} WHERE "_key" = 'key-50000'`],
    // 100k distinct values: an index still helps, but it returns ~50 rows not 1
    ['equality, high-card col', `SELECT count(*) FROM {T} WHERE "name" = 'name 50000'`],
    // narrow range on the SORT key - this is what zone maps prune, on both formats
    // `amount` is Math.round(r * 1000000) / 1000, so its DOMAIN IS 0-1000, not 0-1000000. The first
    // draft of this line read `BETWEEN 500000 AND 501000` and matched zero rows - caught by the
    // selectivity report below, which is the entire reason that report exists.
    ['narrow range on sort key', `SELECT count(*) FROM {T} WHERE "amount" BETWEEN 500 AND 501`],
    // wide range on the sort key: pruning helps less as the range grows
    ['wide range on sort key', `SELECT count(*) FROM {T} WHERE "amount" BETWEEN 200 AND 800`],
    // a low-cardinality predicate no index and no zone map can help - the control
    ['2 predicates (low card)', `SELECT count(*) FROM {T} WHERE "active" = true AND "category" = 'gamma'`],
    // metadata only: the thermometer
    ['count(*)', 'SELECT count(*) FROM {T}'],
    // an aggregation that scans everything - expected to be format-blind
    // wrapped in a count so it returns ONE row: `frame.query` renders to JSON, and 100k result rows
    // would drown the thing being measured in constant serialisation cost
    ['agg: high-card group', `SELECT count(*) FROM (SELECT "name", count(*) FROM {T} GROUP BY 1)`],
];

async function fileBytes(path) {
    let total = 0;
    for (const suffix of ['', '.wal']) {
        try { total += (await stat(path + suffix)).size; } catch { /* not created */ }
    }
    return total;
}

/* ------------------------------------------------------------------ build */

for (const path of [DB, `${DB}.wal`]) if (existsSync(path)) await rm(path, { force: true });
await rm(SPOOL, { recursive: true, force: true });
await mkdir(SPOOL, { recursive: true });

heading(`NATIVE AT ITS BEST — ${num(ROWS)} rows, 30-column corpus`);

const frame = await DuckFrame.create(CONFIG, { name: 'base', database: DB });
const BASE = frame.table ?? 'base';
let built = 0;
while (built < ROWS) {
    const take = Math.min(GEN_CHUNK, ROWS - built);
    await frame.append({ records: makeRecords(take, built + 1) });
    built += take;
}

const q = (sql) => frame.query(sql);

async function battery(relation) {
    const out = {};
    for (const [label, sql] of QUERIES) {
        const samples = [];
        for (let i = 0; i < REPEATS; i++) {
            const start = performance.now();
            await q(sql.replace('{T}', relation));
            samples.push(performance.now() - start);
        }
        out[label] = median(samples.slice(1));
    }
    return out;
}
const timed = async (label, sql) => {
    const start = performance.now();
    await q(sql);
    const ms = performance.now() - start;
    note(`  ${label.padEnd(34)} ${`${(ms / 1000).toFixed(2)}s`.padStart(8)}`);
    return ms;
};

// checkpoint, armed and verified - an uncompressed native table is a different artefact
await q('CREATE OR REPLACE TABLE _arm (a INTEGER)');
await q('DROP TABLE _arm');
await q('CHECKPOINT');

/**
 * **Measure plain native FIRST.** The indexes are created on `base` itself, so the only honest way to
 * have a no-index number for the same table is to take it before they exist. Measuring after, or on a
 * different table, would confound the index with whatever else changed.
 */
heading('WHAT EACH PREDICATE ACTUALLY MATCHES — never time a filter without this');
for (const [label, sql] of QUERIES) {
    if (label === 'count(*)' || label.startsWith('agg')) continue;
    const counted = sql.replace(/^SELECT .*? FROM/, 'SELECT count(*) FROM');
    const rows = await q(counted.replace('{T}', BASE));
    const n = Number(rows[0][0]);
    note(`  ${label.padEnd(28)} ${num(n).padStart(12)} rows`
        + `  ${n === 0 ? '<-- ZERO. The query is meaningless; fix it.' : `(${(n / ROWS * 100).toFixed(2)}%)`}`);
}

const results = [];
results.push(['native plain', await battery(BASE)]);

const checkpoint = async (tag) => {
    await q(`CREATE OR REPLACE TABLE _arm_${tag} (a INTEGER)`);
    await q(`DROP TABLE _arm_${tag}`);
    await q('CHECKPOINT');
};

heading('BUILD COST OF EACH NATIVE ADVANTAGE');
const sortedMs = await timed('rebuild ORDER BY amount', `CREATE TABLE sorted AS SELECT * FROM ${BASE} ORDER BY "amount"`);
await checkpoint('s');
// measured BEFORE any index exists on it, so `native sorted` is sorting alone
results.push(['native sorted', await battery('sorted')]);

const idxKeyMs = await timed('CREATE INDEX on _key', `CREATE INDEX idx_key ON ${BASE}("_key")`);
const idxNameMs = await timed('CREATE INDEX on name (100k card)', `CREATE INDEX idx_name ON ${BASE}("name")`);
await checkpoint('i');
results.push(['native+index', await battery(BASE)]);

// and the cell the first draft omitted: BOTH advantages at once, which is native at its actual best
await timed('CREATE INDEX on sorted(_key)', `CREATE INDEX idx_s_key ON sorted("_key")`);
await timed('CREATE INDEX on sorted(name)', `CREATE INDEX idx_s_name ON sorted("name")`);
await checkpoint('si');
results.push(['native sort+index', await battery('sorted')]);
const nativeBytes = await fileBytes(DB);
note(`  native file with 2 indexes + a sorted copy: ${mb(nativeBytes)}`);

heading('PARQUET, UNSORTED AND SORTED');
const pqPlain = join(SPOOL, 'plain.parquet');
const pqSorted = join(SPOOL, 'sorted.parquet');
await timed('COPY -> parquet zstd', `COPY ${BASE} TO '${pqPlain}' (FORMAT parquet, COMPRESSION zstd)`);
await timed('COPY -> parquet zstd, sorted',
    `COPY (SELECT * FROM ${BASE} ORDER BY "amount") TO '${pqSorted}' (FORMAT parquet, COMPRESSION zstd)`);
note(`  parquet plain ${mb(await fileBytes(pqPlain))} · sorted ${mb(await fileBytes(pqSorted))}`);

/* ------------------------------------------------------------------ measure */

/**
 * The variants. `native+index` and `native` are the SAME TABLE — the indexes exist on `base`, so the
 * only honest way to show the no-index number is to have measured it before creating them. That is
 * what `baseline` below is for.
 */
const VARIANTS = [
    ['parquet', `read_parquet('${pqPlain}')`],
    ['parquet sorted', `read_parquet('${pqSorted}')`],
];

heading('QUERY BATTERY — warm ms, median of the repeats after the first');
for (const [label, relation] of VARIANTS) {
    results.push([label, await battery(relation)]);
}

const header = QUERIES.map(([n]) => n.slice(0, 22).padStart(24)).join('');
console.log(`    ${'variant'.padEnd(16)}${header}`);
for (const [label, r] of results) {
    console.log(`    ${label.padEnd(16)}`
        + QUERIES.map(([n]) => r[n].toFixed(2).padStart(24)).join(''));
}

heading('THE COMPARISONS THAT ANSWER THE QUESTION');
const get = (label) => results.find(([l]) => l === label)[1];
const ratio = (a, b, name) => {
    const x = get(a)[name];
    const y = get(b)[name];
    return `${(y / x).toFixed(1)}x`;
};
note('  BEST against BEST — native sorted+indexed vs parquet sorted:');
for (const [name] of QUERIES) {
    note(`    ${name.padEnd(26)} native ${get('native sort+index')[name].toFixed(2)} ms`
        + ` · parquet ${get('parquet sorted')[name].toFixed(2)} ms`
        + ` -> ${ratio('native sort+index', 'parquet sorted', name)}`);
}
note('');
note('  plain against plain, for contrast:');
for (const [name] of QUERIES) {
    note(`    ${name.padEnd(26)} native ${get('native plain')[name].toFixed(2)} ms`
        + ` · parquet ${get('parquet')[name].toFixed(2)} ms`
        + ` -> ${ratio('native plain', 'parquet', name)}`);
}
note('');
note('  each advantage ISOLATED against its own baseline:');
note('    (index vs plain native · sort vs plain native · sort vs plain parquet)');
for (const [name] of QUERIES) {
    const idxGain = get('native plain')[name] / get('native+index')[name];
    const natSortGain = get('native plain')[name] / get('native sorted')[name];
    const bothGain = get('native plain')[name] / get('native sort+index')[name];
    const pqSortGain = get('parquet')[name] / get('parquet sorted')[name];
    note(`    ${name.padEnd(26)} index ${idxGain.toFixed(2)}x`
        + ` · nat sort ${natSortGain.toFixed(2)}x`
        + ` · nat BOTH ${bothGain.toFixed(2)}x`
        + ` · pq sort ${pqSortGain.toFixed(2)}x`);
}
note('');
note(`  the index cost ${((idxKeyMs + idxNameMs) / 1000).toFixed(1)}s to build`
    + ` and the sort ${(sortedMs / 1000).toFixed(1)}s - both are per-table, paid once, and`);
note('  neither is available to a Parquet view at any price (the sort is, the index is not)');

await rm(SPOOL, { recursive: true, force: true });
await closeDuckDatabase(DB);
for (const suffix of ['', '.wal']) {
    if (existsSync(DB + suffix)) await rm(DB + suffix, { force: true });
}
process.exit(0);
