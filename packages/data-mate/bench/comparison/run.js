/**
 * Runs the DataFrame-vs-TealFrame comparison and writes the report.
 *
 *     cd packages/data-mate && pnpm build
 *     node --max-old-space-size=16384 bench/comparison/run.js
 *
 *     SCALES=1000,10000 node bench/comparison/run.js        # a quick pass
 *     RUNS=5 node ...                                        # more samples per case
 *     OUT=bench/comparison/PERFORMANCE.md node ...        # where the report goes
 *
 * The larger scales need the heap flag. `DataFrame` holds every value in JS and runs out of
 * memory early on Node's default heap, which would overstate the difference. Where it still runs
 * out of memory, that is reported as a result.
 *
 * For a full sweep, use `sweep.js`. A large `DataFrame` case can abort the process instead of
 * throwing; the supervisor restarts this runner and records the case that died.
*/
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {
    measure, line, heading, progress, progressHeader, runsFor, heapLimitMB, classify,
    CHECKPOINT, checkpointTables, PREFER_SQL,
} from './lib/harness.js';
import {
    CONFIG, COLUMNS, SCALES, makeRecords, label
} from './lib/generate.js';
import { GROUPS } from './lib/cases.js';
import { lifecycle } from './lifecycle/search-lifecycle.js';
import {
    loadResults, saveResults, indexRows, rowFor, withMismatch, keyOf,
    markInflight, clearInflight, RESULTS_FILE,
} from './lib/results.js';
import { writeReport } from './lib/report.js';
import {
    DataFrame, dataFrameAdapter, TealFrame, closeDuckDatabase, tealFrameAdapter,
    functionConfigRepository
} from '../../dist/src/index.js';

const OUT = process.env.OUT || 'bench/comparison/PERFORMANCE.md';

/**
 * Which engine this process measures. Unset means both.
 *
 * At 3M rows `DataFrame.unique(fields)` exhausts the heap and V8 aborts the process (exit 134)
 * instead of throwing, which would lose every case after it. Running each engine in its own
 * process keeps a DataFrame abort from losing TealFrame's results:
 *
 *     ENGINE=tealframe SCALES=5000000 node --max-old-space-size=24576 bench/comparison/run.js
 *     ENGINE=dataframe SCALES=5000000 node --max-old-space-size=24576 bench/comparison/run.js
*/
const ENGINE = process.env.ENGINE;
if (ENGINE && !['dataframe', 'tealframe'].includes(ENGINE)) {
    throw new Error(`ENGINE must be 'dataframe' or 'tealframe', got ${JSON.stringify(ENGINE)}`);
}
const RUN_DF = ENGINE !== 'tealframe';
const RUN_DUCK = ENGINE !== 'dataframe';

/**
 * Cases this process must skip, as `scale::group::case` keys. `sweep.js` sets it to the cases
 * that killed a previous process; their cells are already recorded as OOM.
*/
const SKIP = new Set(JSON.parse(process.env.SKIP || '[]'));

/**
 * Results are saved to `RESULTS_FILE` after every case, and the report is rendered from that file.
 * A large `DataFrame` case can kill the process, so saving often means a death loses only the case
 * that was running; the in-flight marker (see `lib/results.js`) lets the supervisor record it.
*/
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-compare-'));
const written = [];

function tmp(name, ext = 'parquet') {
    const file = path.join(scratch, `${name}.${ext}`);
    written.push(file);
    return file;
}

/** Everything measured so far, including previous processes' scales and engines. */
const state = loadResults();
const index = indexRows(state.rows);

// re-running a scale replaces its lifecycle results, which are always measured as a pair
for (const scale of SCALES) {
    state.lifecycleRows = state.lifecycleRows.filter((row) => row.scale !== scale);
}

/**
 * Measures one engine's half of a case: its setup, timing, and teardown, each with its own error
 * handling. Keeping the halves independent attributes a failure to the engine that had it, so one
 * engine failing does not hide the other engine's result.
*/
async function runHalf(half, testCase, ctx) {
    const setup = half === 'df' ? testCase.setupDataFrame : testCase.setupTealFrame;
    const teardown = half === 'df' ? testCase.teardownDataFrame : testCase.teardownTealFrame;
    const run = half === 'df' ? testCase.dataFrame : testCase.tealFrame;

    let prepared;
    try {
        prepared = setup ? await setup(ctx) : undefined;
    } catch (err) {
        return classify(err, 'setup');
    }

    /**
     * With `CHECKPOINT=1`, compresses what setup built before the timing starts. A checkpoint is
     * a one-time cost per frame, while the case is a per-query cost, so it is kept out of the
     * timing. Its benefit is this run compared with the same sweep without the flag.
    */
    let checkpointMs = 0;
    if (half === 'duck') {
        try {
            checkpointMs = await checkpointTables(prepared);
        } catch (err) {
            return classify(err, 'checkpoint');
        }
    }

    const result = await measure(() => run(ctx, prepared), { runs: runsFor(ctx.scale) });
    if (checkpointMs) result.checkpointMs = checkpointMs;

    if (teardown) {
        try {
            await teardown(ctx, prepared);
        } catch { /* teardown failures must not lose the measurement */ }
    }

    return result;
}

heading('DataFrame vs TealFrame');
line(`${COLUMNS.length} columns, ${Object.keys(CONFIG.fields).length} declared field paths`);
line(`scales: ${SCALES.map(label).join(', ')}   runs per case: ${process.env.RUNS || '3 / 2 / 1 by scale'}`
    + ' (median, after a discarded warm-up)');
line(`node ${process.version} | ${os.cpus().length} cores | ${(os.totalmem() / 1024 ** 3).toFixed(0)} GB RAM`
    + ` | heap limit ${heapLimitMB() ? `${heapLimitMB()} MB` : 'default'}`);
line(`engine: ${ENGINE ?? 'both (single process)'}   results: ${RESULTS_FILE}`);
line('TealFrame tables: '
    + (CHECKPOINT ? 'CHECKPOINTED in setup (compressed)' : 'uncompressed (no checkpoint)'));
if (SKIP.size) line(`skipping ${SKIP.size} case(s) that killed an earlier process`);

for (const scale of SCALES) {
    heading(`${label(scale)} records`);

    const records = makeRecords(scale);

    // the Parquet file every "from Parquet" case reads, written once and not timed. Only
    // TealFrame reads it, so an ENGINE=dataframe process skips building it.
    let parquet;
    if (RUN_DUCK) {
        try {
            const producer = await TealFrame.fromRecords(CONFIG, records, {});
            parquet = tmp(`corpus-${scale}`);
            await producer.writeParquet(parquet);
            await producer.destroy();
        } catch (err) {
            line(`  could not build the Parquet corpus: ${err.message}`);
        }
    }

    const ctx = {
        DataFrame,
        TealFrame,
        dfAdapter: dataFrameAdapter,
        /**
         * Wrapped so `PREFER_SQL` applies to every case by default. A case that sets `preferSql`
         * itself still takes precedence.
        */
        duckAdapter: (fnDef, options) => tealFrameAdapter(
            fnDef,
            PREFER_SQL === undefined ? options : { preferSql: PREFER_SQL, ...options }
        ),
        repo: functionConfigRepository,
        config: CONFIG,
        records,
        parquet,
        scale,
        tmp,
    };

    progressHeader();

    for (const group of GROUPS) {
        for (const testCase of group.cases) {
            const at = { scale, group: group.title, name: testCase.name };
            const row = rowFor(index, at);
            row.note = testCase.note;

            if (SKIP.has(keyOf(scale, group.title, testCase.name))) {
                line(`  ${label(scale).padEnd(8)}${testCase.name.padEnd(26)}`
                    + '  skipped: it killed an earlier process');
            } else {
                if (RUN_DF) {
                    markInflight({ ...at, half: 'df' });
                    row.df = await runHalf('df', testCase, ctx);
                }
                if (RUN_DUCK) {
                    markInflight({ ...at, half: 'duck' });
                    row.duck = await runHalf('duck', testCase, ctx);
                }
                clearInflight();
            }

            index.set(keyOf(scale, group.title, testCase.name), withMismatch(row));
            progress(label(scale), testCase.name, row.df, row.duck);

            // save after every case, because the next one may kill the process
            state.rows = [...index.values()];
            saveResults(state);
        }
    }
}

// ---------------------------------------------------------------- lifecycle
/**
 * Skipped in a per-engine process, because every lifecycle stage times both engines as a pair.
 * Run the scale without `ENGINE` to include it.
*/
const lifecycleRows = ENGINE
    ? state.lifecycleRows
    : [
        ...state.lifecycleRows,
        ...await lifecycle({
            DataFrame, TealFrame, config: CONFIG, makeRecords, SCALES, tmp, measure, label, line,
            heading, runsFor,
        }),
    ];
if (ENGINE) line(`\nlifecycle skipped - it measures both engines as a pair (ENGINE=${ENGINE})`);
state.lifecycleRows = lifecycleRows;
saveResults(state);

// ---------------------------------------------------------------- the report
const report = writeReport({
    rows: [...index.values()], lifecycleRows, groups: GROUPS, scales: SCALES,
    meta: {
        node: process.version,
        cores: os.cpus().length,
        memory: `${(os.totalmem() / 1024 ** 3).toFixed(0)} GB`,
        heap: heapLimitMB() ? `${heapLimitMB()} MB` : 'default',
        // matches the progress header; the sample count varies by scale unless RUNS is set
        runs: process.env.RUNS || '3 / 2 / 1 by scale',
        columns: COLUMNS.length,
        paths: Object.keys(CONFIG.fields).length,
        checkpoint: CHECKPOINT,
        preferSql: PREFER_SQL,
    },
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, report);
line(`\nreport written to ${OUT}`);

for (const file of written) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
}
fs.rmSync(scratch, { recursive: true, force: true });
await closeDuckDatabase();

/**
 * Exits explicitly, because otherwise the process never ends.
 *
 * A process that has registered a scalar function does not exit after its work is done, even
 * after `closeDuckDatabase()` calls `instance.closeSync()`. This is a known issue in the DuckDB
 * Node bindings (node-neo PR #457), and the test runner uses `--forceExit` for the same reason.
 * Every transform and validation case registers a UDF.
*/
process.exit(0);
