/**
 * Who actually benefits from a CHECKPOINT: every column TYPE crossed with every CARDINALITY.
 *
 * The claim in circulation is "a UDF runs once per distinct value once the column is compressed, so a
 * checkpoint is worth 100x on a low-cardinality column and nothing on a unique one". That was measured
 * on exactly two columns - `category` (5 distinct Keyword) and `email` (unique Keyword) - and then
 * generalised to 205 functions over 30 columns of a dozen types. Two data points of one type is not a
 * basis for a policy that decides whether every query pays a second of checkpoint time.
 *
 * The suspicion worth testing: **the once-per-distinct-value effect is a property of DICTIONARY
 * encoding, not of low cardinality.** A repetitive Keyword becomes `DICT_FSST`, but a repetitive
 * INTEGER may become `BitPacking` and a DOUBLE `ALP` - neither of which is a dictionary, so a UDF over
 * them could still be called once per ROW even though the column compressed beautifully. If that is
 * true, "low cardinality" is the wrong test and "which compression scheme did this column get" is the
 * right one.
 *
 * So: one table, a column per (type, cardinality) pair, identical UDF shape over each - counting its
 * own calls - measured uncompressed and then checkpointed, with the compression scheme reported next
 * to the result. Same rows, same query, same UDF body; only the column differs.
 *
 *     cd packages/data-mate && pnpm build
 *     node docs/tools/bench/checkpoint-by-type.mjs
 *     ROWS=2000000 node docs/tools/bench/checkpoint-by-type.mjs
*/
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const { DuckFrame, closeDuckDatabase, registerScalarFunction } = await import(
    dist('duck-frame/DuckFrame.js')
);

const ROWS = Number(process.env.ROWS || 1_000_000);

/** Distinct-value counts to compare. `unique` is one distinct value per row. */
const CARDINALITIES = [
    { label: 'low', distinct: 5 },
    { label: 'medium', distinct: 1000 },
    { label: 'unique', distinct: ROWS },
];

/**
 * One entry per FieldType worth testing, with a generator that produces exactly `distinct` values.
 *
 * `Boolean` cannot honour a cardinality above 2, which is itself informative: it is the floor case.
*/
const TYPES = [
    {
        type: 'Keyword',
        value: (n) => `keyword-value-${n}`,
    },
    {
        type: 'Text',
        value: (n) => `some longer text body number ${n} with words in it`,
    },
    {
        type: 'Integer',
        value: (n) => n,
    },
    {
        type: 'Long',
        value: (n) => 4_000_000_000 + n,
    },
    {
        type: 'Double',
        value: (n) => n + 0.5,
    },
    {
        type: 'Boolean',
        value: (n) => n % 2 === 0,
    },
    {
        type: 'Date',
        value: (n) => new Date(1_700_000_000_000 + n * 1000).toISOString(),
    },
    {
        type: 'IP',
        value: (n) => `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`,
    },
];

const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

const columnName = (type, label) => `${type}_${label}`.toLowerCase();

const fields = {};
for (const { type } of TYPES) {
    for (const { label } of CARDINALITIES) {
        fields[columnName(type, label)] = { type };
    }
}
const CONFIG = { version: 1, fields };

function makeRecords(rows) {
    const records = new Array(rows);
    for (let i = 0; i < rows; i++) {
        const record = {};
        for (const { type, value } of TYPES) {
            for (const { label, distinct } of CARDINALITIES) {
                record[columnName(type, label)] = value(i % distinct);
            }
        }
        records[i] = record;
    }
    return records;
}

/**
 * One counting UDF per input type. The BODY is identical everywhere - stringify the value - so the
 * only thing that varies across the matrix is the column, not the work.
*/
let calls = 0;
const udfFor = new Map();

async function registerAll() {
    for (const { type } of TYPES) {
        const name = `count_${type}`.toLowerCase();
        await registerScalarFunction({
            name,
            parameter: type,
            returns: { type: 'Keyword' },
            fn: (value) => {
                calls++;
                return String(value);
            },
        });
        udfFor.set(type, name);
    }
}

async function compressionOf(frame, table, column) {
    const rows = await frame.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}')
         WHERE column_name = '${column}' GROUP BY 1 ORDER BY 2 DESC`
    );
    return rows.map(([scheme, count]) => `${scheme}:${count}`).join(' ') || '-';
}

/** Times the UDF over one column and returns how many times it was actually called. */
async function timeUdf(frame, table, type, column) {
    const udf = udfFor.get(type);
    const sql = `SELECT sum(length(${udf}(${JSON.stringify(column)}))) FROM "${table}"`;

    calls = 0;
    const start = performance.now();
    const rows = await frame.query(sql);
    const ms = performance.now() - start;
    return { ms, calls, answer: String(rows[0][0]) };
}

async function checkpoint(frame, table) {
    const uncompressed = async () => Number((await frame.query(
        `SELECT count(*) FROM pragma_storage_info('${table}') WHERE compression = 'Uncompressed'`
    ))[0][0] ?? 0);

    const before = await uncompressed();
    // armed: a plain CHECKPOINT after the ingest path silently declines. See HANDOFF.md.
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    const start = performance.now();
    await frame.query('CHECKPOINT');
    const ms = performance.now() - start;
    const after = await uncompressed();
    if (before && after >= before) {
        throw new Error(`CHECKPOINT did nothing: ${before} -> ${after} uncompressed segments`);
    }
    return ms;
}

log(`\n${ROWS.toLocaleString()} rows, ${TYPES.length} types x ${CARDINALITIES.length}`
    + ` cardinalities = ${Object.keys(fields).length} columns`);
log(`node ${process.version}, ${os.cpus().length} cores\n`);

await registerAll();
const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'matrix' });
const table = frame.table;

const results = [];

for (const phase of ['uncompressed', 'checkpointed']) {
    if (phase === 'checkpointed') {
        const ms = await checkpoint(frame, table);
        log(`\ncheckpoint: ${ms.toFixed(0)} ms\n`);
    }

    for (const { type } of TYPES) {
        for (const { label, distinct } of CARDINALITIES) {
            const column = columnName(type, label);
            const scheme = await compressionOf(frame, table, column);
            const run = await timeUdf(frame, table, type, column);

            results.push({
                type, label, distinct, phase, scheme, ...run
            });

            log(`  ${phase.padEnd(14)}${type.padEnd(9)}${label.padEnd(8)}`
                + `${`${run.ms.toFixed(0)} ms`.padStart(9)}`
                + `   ${run.calls.toLocaleString().padStart(10)} udf calls`
                + `   ${scheme}`);
        }
    }
}

log(`\n${'='.repeat(120)}`);
log('| type | cardinality | compression after checkpoint | UDF calls before | UDF calls after |'
    + ' ms before | ms after | speedup |');
log('|---|---|---|---|---|---|---|---|');
for (const { type } of TYPES) {
    for (const { label, distinct } of CARDINALITIES) {
        const before = results.find(
            (r) => r.type === type && r.label === label && r.phase === 'uncompressed'
        );
        const after = results.find(
            (r) => r.type === type && r.label === label && r.phase === 'checkpointed'
        );
        if (!before || !after) continue;

        const same = before.answer === after.answer;
        log(`| ${type} | ${label} (${distinct.toLocaleString()}) | ${after.scheme} |`
            + ` ${before.calls.toLocaleString()} | ${after.calls.toLocaleString()} |`
            + ` ${before.ms.toFixed(0)} ms | ${after.ms.toFixed(0)} ms |`
            + ` **${(before.ms / after.ms).toFixed(1)}x**${same ? '' : ' **ANSWER CHANGED**'} |`);
    }
}

const changed = results.filter((r) => {
    const pair = results.find(
        (o) => o.type === r.type && o.label === r.label && o.phase !== r.phase
    );
    return pair && pair.answer !== r.answer;
});
log(`\nanswers identical before and after the checkpoint: ${changed.length ? 'NO' : 'YES'}`);

await frame.destroy();
await closeDuckDatabase();
process.exit(0);
