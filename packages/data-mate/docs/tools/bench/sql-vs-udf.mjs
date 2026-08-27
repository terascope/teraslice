/**
 * The SAME function, both ways: as a spliced SQL expression and as a JavaScript UDF.
 *
 * This is the number the SQL-vs-UDF dispatch descriptor exists for. A UDF costs ~178 ns per value of
 * pure marshalling and runs single-threaded, because the node binding blocks the DuckDB worker thread
 * until JavaScript returns; native SQL is 1-2 ns and uses every core. What that is worth for a REAL
 * function on a REAL column is what this measures - per function, and across the two things that
 * change the answer:
 *
 *  1. **Compression.** After a `CHECKPOINT` a UDF is called once per DISTINCT value per row group
 *     instead of once per row, so the UDF path gets dramatically better on a repetitive column and the
 *     SQL advantage shrinks. Quoting a ratio measured only on an uncompressed table would overstate
 *     the case for SQL, so both states are measured.
 *  2. **How much of the data takes the fast path.** `toUpperCase` and `toLowerCase` are `upper()` /
 *     `lower()` only for ASCII - JavaScript uses full case mapping, DuckDB simple mapping - so they
 *     emit a guarded expression that falls back to the UDF per value. Their advantage therefore decays
 *     as non-ASCII values appear, and the decay is the thing a policy needs to know.
 *
 * Every pair is checked to produce the SAME answer (a checksum over the projected column) before its
 * ratio is reported. A faster wrong answer is not an answer.
 *
 *     cd packages/data-mate && pnpm build
 *     node docs/tools/bench/sql-vs-udf.mjs
 *     ROWS=5000000 NON_ASCII=0,0.1,0.5 node docs/tools/bench/sql-vs-udf.mjs
*/
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { duckFrameAdapter } = await import(dist('adapters/duck-frame-adapter/index.js'));
const { functionConfigRepository } = await import(dist('function-configs/index.js'));

const ROWS = Number(process.env.ROWS || 2_000_000);
/** Fraction of values that are NOT ASCII, so the guarded emissions have to fall back. */
const NON_ASCII = (process.env.NON_ASCII || '0,0.1').split(',').map((s) => Number(s.trim()));
const CARDINALITY = Number(process.env.CARDINALITY || 1000);

const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

/**
 * Which functions to time.
 *
 * The promoted ones are discovered from the repository rather than listed, so this cannot fall behind
 * the descriptors. `control` names functions with no emission at all - they measure the same thing
 * twice and must come out at 1.0x, which is what proves the harness is not measuring itself.
*/
const repo = functionConfigRepository;
const PROMOTED = Object.entries(repo)
    .filter(([, config]) => config?.sql != null)
    .map(([name]) => name);
const CONTROL = ['isEmail'];

const ARGS = { trim: {}, trimStart: {}, trimEnd: {} };

/**
 * The corpus: one Keyword column, fixed cardinality, a controlled share of non-ASCII values.
 *
 * Cardinality is fixed rather than unique because that is what compression responds to, and it is the
 * axis the UDF path lives or dies on. Values are padded with whitespace so `trim` has work to do.
*/
function makeRecords(rows, nonAsciiFraction) {
    const ascii = Array.from(
        { length: CARDINALITY },
        (_unused, n) => `  Value ${n} Mixed Case  `
    );
    // 'ß' and the ligature are exactly the values that force the JavaScript path
    const nonAscii = Array.from(
        { length: CARDINALITY },
        (_unused, n) => `  Straße ${n} ﬁle  `
    );

    const records = new Array(rows);
    for (let i = 0; i < rows; i++) {
        const useNonAscii = nonAsciiFraction > 0 && (i % 1000) < Math.round(nonAsciiFraction * 1000);
        const pool = useNonAscii ? nonAscii : ascii;
        records[i] = { field: pool[i % CARDINALITY] };
    }
    return records;
}

const CONFIG = { version: 1, fields: { field: { type: 'Keyword' } } };

/** Arms and verifies a checkpoint - a plain one after ingest silently declines. See HANDOFF.md. */
async function checkpoint(frame, table) {
    const uncompressed = async () => Number((await frame.query(
        `SELECT count(*) FROM pragma_storage_info('${table}') WHERE compression = 'Uncompressed'`
    ))[0][0] ?? 0);

    const before = await uncompressed();
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    await frame.query('CHECKPOINT');
    const after = await uncompressed();
    if (before && after >= before) {
        throw new Error(`CHECKPOINT did nothing: ${before} -> ${after} uncompressed segments`);
    }
}

/**
 * Times one dispatch path, and returns what it produced so the two can be compared.
 *
 * Forced with an AGGREGATE, not a table write: a `CREATE TABLE AS` spends most of its time writing
 * 2M rows, which buries the difference being measured. The checksum touches every value.
*/
async function time(frame, table, config, args, preferSql) {
    const adapted = await duckFrameAdapter(config, {
        field: 'field',
        inputConfig: { field_config: { type: 'Keyword' } },
        args,
        preferSql,
    });

    const sql = `SELECT count(*), count(x), sum(length(x)), sum(hash(x)::HUGEINT)`
        + ` FROM (SELECT ${adapted.expression} AS x FROM "${table}")`;

    // warm-up, discarded: the first call pays for UDF registration and DuckDB plan cache
    await frame.query(sql);

    const cpuBefore = process.cpuUsage();
    const start = performance.now();
    const rows = await frame.query(sql);
    const ms = performance.now() - start;
    const cpu = process.cpuUsage(cpuBefore);

    return {
        ms,
        dispatch: adapted.dispatch,
        cores: (cpu.user + cpu.system) / 1000 / ms,
        checksum: JSON.stringify(rows[0]),
    };
}

const results = [];

async function measure(name, config, nonAsciiFraction) {
    const frame = await DuckFrame.fromRecords(
        CONFIG, makeRecords(ROWS, nonAsciiFraction), { name: 'corpus' }
    );
    const table = frame.table;
    const args = ARGS[name] ?? {};

    try {
        for (const compressed of [false, true]) {
            if (compressed) await checkpoint(frame, table);

            const udf = await time(frame, table, config, args, false);
            const sql = await time(frame, table, config, args, true);
            const agree = udf.checksum === sql.checksum;

            results.push({
                name,
                nonAsciiFraction,
                compressed,
                udfMs: udf.ms,
                sqlMs: sql.ms,
                ratio: udf.ms / sql.ms,
                udfCores: udf.cores,
                sqlCores: sql.cores,
                dispatch: sql.dispatch,
                agree,
            });

            log(`  ${name.padEnd(13)}${`${(nonAsciiFraction * 100).toFixed(0)}% non-ascii`.padEnd(16)}`
                + `${(compressed ? 'checkpointed' : 'uncompressed').padEnd(14)}`
                + `udf ${`${udf.ms.toFixed(0)} ms`.padStart(8)} (${udf.cores.toFixed(1)} cores)`
                + `   sql ${`${sql.ms.toFixed(0)} ms`.padStart(8)} (${sql.cores.toFixed(1)} cores)`
                + `   ${(udf.ms / sql.ms).toFixed(1)}x  [${sql.dispatch}]`
                + `${agree ? '' : '   *** ANSWERS DIFFER ***'}`);
        }
    } finally {
        await frame.destroy();
        await closeDuckDatabase();
    }
}

log(`\n${ROWS.toLocaleString()} rows, ${CARDINALITY} distinct values, node ${process.version},`
    + ` ${os.cpus().length} cores`);
log(`promoted: ${PROMOTED.join(', ')}   control (no emission): ${CONTROL.join(', ')}\n`);

for (const fraction of NON_ASCII) {
    for (const name of [...PROMOTED, ...CONTROL]) {
        const config = repo[name];
        if (!config) {
            log(`  ${name}: not in the repository, skipped`);
            continue;
        }
        await measure(name, config, fraction);
    }
    log('');
}

log('='.repeat(118));
log('| function | non-ascii | table | UDF | cores | SQL | cores | SQL speedup | dispatch |'
    + ' same answer |');
log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
    log(`| ${r.name} | ${(r.nonAsciiFraction * 100).toFixed(0)}% |`
        + ` ${r.compressed ? 'checkpointed' : 'uncompressed'} |`
        + ` ${r.udfMs.toFixed(0)} ms | ${r.udfCores.toFixed(1)} |`
        + ` ${r.sqlMs.toFixed(0)} ms | ${r.sqlCores.toFixed(1)} |`
        + ` **${r.ratio.toFixed(1)}x** | ${r.dispatch} |`
        + ` ${r.agree ? 'yes' : '**NO**'} |`);
}

const wrong = results.filter((r) => !r.agree);
if (wrong.length) {
    log(`\n**${wrong.length} pair(s) produced DIFFERENT answers - those ratios are void:**`);
    for (const r of wrong) log(`  ${r.name} @ ${r.nonAsciiFraction * 100}% non-ascii`);
}

process.exit(0);
