/**
 * Runs the DataFrame-vs-DuckFrame comparison and writes the report.
 *
 *     cd packages/data-mate && pnpm build
 *     node --max-old-space-size=16384 bench/comparison/run.js
 *
 *     SCALES=1000,10000 node bench/comparison/run.js        # a quick pass
 *     RUNS=5 node ...                                        # more samples per case
 *     OUT=docs/PERFORMANCE.md node ...                       # where the report goes
 *
 * The heap flag is not optional at the larger scales: `DataFrame` holds every value in JS, and
 * with Node's default heap it will OOM well before `DuckFrame` breaks a sweat. Giving it room is
 * what makes the comparison fair - and where it OOMs anyway, that is reported as a result.
 *
 * **For a full sweep use `sweep.js`, not this file directly.** A `DataFrame` case can abort the
 * PROCESS rather than throw, which no `try/catch` here can survive; the supervisor restarts this
 * runner and records the case that died. See its docstring.
*/
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
    measure, line, heading, progress, progressHeader, runsFor, heapLimitMB, classify,
    CHECKPOINT, checkpointTables, PREFER_SQL,
} from './lib/harness.js';
import {
    CONFIG, COLUMNS, SCALES, makeRecords, label
} from './lib/generate.js';
import { GROUPS } from './lib/cases.js';
import { lifecycle } from './lifecycle/spaces.js';
import {
    loadResults, saveResults, indexRows, rowFor, withMismatch, keyOf,
    markInflight, clearInflight, RESULTS_FILE,
} from './lib/results.js';

const require = createRequire(import.meta.url);
const dist = (rel) => pathToFileURL(require.resolve(`../../dist/src/${rel}`)).href;

const { DataFrame } = await import(dist('index.js'));
const { dataFrameAdapter } = await import(dist('adapters/data-frame-adapter/index.js'));
const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { duckFrameAdapter } = await import(dist('adapters/duck-frame-adapter/index.js'));
const { functionConfigRepository } = await import(dist('function-configs/index.js'));

const OUT = process.env.OUT || 'docs/PERFORMANCE.md';

/**
 * Which engine this process measures. Unset means both, which is what the small scales use.
 *
 * **Splitting them is what makes the big scales survivable.** At 3M `DataFrame.unique(fields)`
 * exhausts the heap in a way V8 cannot report as an exception - it prints `Ineffective
 * mark-compacts near heap limit` and aborts the process (exit 134). Nothing in-process can catch
 * that, so it took out the 12 cases that came after it, at 3M and again at 5M. Running
 * `ENGINE=duckframe` in its own process means DataFrame cannot do that to DuckFrame's numbers,
 * and `ENGINE=dataframe` afterwards records whatever DataFrame manages before it dies.
 *
 *     ENGINE=duckframe SCALES=5000000 node --max-old-space-size=24576 bench/comparison/run.js
 *     ENGINE=dataframe SCALES=5000000 node --max-old-space-size=24576 bench/comparison/run.js
*/
const ENGINE = process.env.ENGINE;
if (ENGINE && !['dataframe', 'duckframe'].includes(ENGINE)) {
    throw new Error(`ENGINE must be 'dataframe' or 'duckframe', got ${JSON.stringify(ENGINE)}`);
}
const RUN_DF = ENGINE !== 'duckframe';
const RUN_DUCK = ENGINE !== 'dataframe';

/**
 * Cases this process must NOT attempt, as `scale::group::case` keys.
 *
 * `sweep.js` fills it with the cases that killed a previous process outright: their cell is
 * already recorded as an OOM, and re-running them would only kill this process too.
*/
const SKIP = new Set(JSON.parse(process.env.SKIP || '[]'));

/**
 * Results are appended to `RESULTS_FILE` after EVERY half, and the report is rendered from it.
 *
 * **Because a big enough `DataFrame` case does not throw - it kills the process.** Persisting per
 * half means a death at 5M costs only that half, and the in-flight marker (see `lib/results.js`)
 * lets the supervisor turn it into an `OOM` cell rather than a hole.
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

// a re-run of a scale replaces that scale's LIFECYCLE numbers, which are always measured as a pair
for (const scale of SCALES) {
    state.lifecycleRows = state.lifecycleRows.filter((row) => row.scale !== scale);
}

/**
 * Measures ONE engine's half of a case: its own setup, its own timing, its own teardown, each
 * with its own error capture.
 *
 * **The halves are independent so that a failure is attributed to the engine that had it.** When
 * setup built both engines' prerequisites together, a `DataFrame` that could not even be
 * constructed at 5M skipped the case for BOTH sides - so the report lost DuckFrame's number
 * instead of reporting DataFrame's ceiling, which is the finding.
*/
async function runHalf(half, testCase, ctx) {
    const setup = half === 'df' ? testCase.setupDataFrame : testCase.setupDuckFrame;
    const teardown = half === 'df' ? testCase.teardownDataFrame : testCase.teardownDuckFrame;
    const run = half === 'df' ? testCase.dataFrame : testCase.duckFrame;

    let prepared;
    try {
        prepared = setup ? await setup(ctx) : undefined;
    } catch (err) {
        return classify(err, 'setup');
    }

    /**
     * `CHECKPOINT=1` compresses what setup built, before the timing starts.
     *
     * Deliberately part of SETUP and not of the measurement: a checkpoint is a one-off cost paid
     * once per frame when ingest is quiesced, while the case below is a per-query cost paid every
     * time a question is asked. Charging the one to the other would answer neither. What a
     * checkpoint COSTS is measured per size by `docs/tools/bench/checkpoint-cost.mjs`; what it
     * BUYS is this run, compared against the same sweep with the flag off.
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

heading('DataFrame vs DuckFrame');
line(`${COLUMNS.length} columns, ${Object.keys(CONFIG.fields).length} declared field paths`);
line(`scales: ${SCALES.map(label).join(', ')}   runs per case: ${process.env.RUNS || '3 / 2 / 1 by scale'}`
    + ' (median, after a discarded warm-up)');
line(`node ${process.version} | ${os.cpus().length} cores | ${(os.totalmem() / 1024 ** 3).toFixed(0)} GB RAM`
    + ` | heap limit ${heapLimitMB() ? `${heapLimitMB()} MB` : 'default'}`);
line(`engine: ${ENGINE ?? 'both (single process)'}   results: ${RESULTS_FILE}`);
line('DuckFrame tables: '
    + (CHECKPOINT ? 'CHECKPOINTED in setup (compressed)' : 'uncompressed (no checkpoint)'));
if (SKIP.size) line(`skipping ${SKIP.size} case(s) that killed an earlier process`);

for (const scale of SCALES) {
    heading(`${label(scale)} records`);

    const records = makeRecords(scale);

    // the Parquet payload every "from Parquet" case reads, produced once and not timed. Only
    // DuckFrame reads it, so an ENGINE=dataframe process must not spend the memory building it.
    let parquet;
    if (RUN_DUCK) {
        try {
            const producer = await DuckFrame.fromRecords(CONFIG, records, {});
            parquet = tmp(`corpus-${scale}`);
            await producer.writeParquet(parquet);
            await producer.destroy();
        } catch (err) {
            line(`  could not build the Parquet corpus: ${err.message}`);
        }
    }

    const ctx = {
        DataFrame,
        DuckFrame,
        dfAdapter: dataFrameAdapter,
        /**
         * Wrapped rather than passed through, so `PREFER_SQL` reaches every case without any of
         * them opting in. A case that set `preferSql` itself would still win, which is the right
         * precedence: the flag is a default for the run, not an override of a case's intent.
        */
        duckAdapter: (fnDef, options) => duckFrameAdapter(
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

            // after EVERY case: the next one may kill the process outright
            state.rows = [...index.values()];
            saveResults(state);
        }
    }
}

// ---------------------------------------------------------------- lifecycle
/**
 * Skipped in a per-engine process: every lifecycle stage times the two engines as a PAIR, so
 * half of one is not a result. Run the scale without `ENGINE` to get it - which works wherever
 * `DataFrame` can still complete the stage at all.
*/
const lifecycleRows = ENGINE
    ? state.lifecycleRows
    : [
        ...state.lifecycleRows,
        ...await lifecycle({
            DataFrame, DuckFrame, config: CONFIG, makeRecords, SCALES, tmp, measure, label, line,
            heading, runsFor,
        }),
    ];
if (ENGINE) line(`\nlifecycle skipped - it measures both engines as a pair (ENGINE=${ENGINE})`);
state.lifecycleRows = lifecycleRows;
saveResults(state);

// ---------------------------------------------------------------- the report
const { writeReport } = await import('./lib/report.js');
const report = writeReport({
    rows: [...index.values()], lifecycleRows, groups: GROUPS, scales: SCALES,
    meta: {
        node: process.version,
        cores: os.cpus().length,
        memory: `${(os.totalmem() / 1024 ** 3).toFixed(0)} GB`,
        heap: heapLimitMB() ? `${heapLimitMB()} MB` : 'default',
        // the same string the progress header prints: a flat `RUNS` here claimed "median of
        // 3 runs" even at 5M, where the policy takes ONE sample
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
 * **Explicit exit, because this process will otherwise never end.**
 *
 * A process that has REGISTERED A SCALAR FUNCTION does not exit when its work is done, even though
 * `closeDuckDatabase()` calls `instance.closeSync()` - a known node-neo defect (their PR #457), and
 * the same reason every script in `docs/tools/` ends this way and the test runner uses
 * `--forceExit`. Every transform and validation case here registers a UDF, so every run hits it.
 *
 * It cost about 30 MINUTES PER SCALE before it was found: the child printed its whole report, went
 * to 0% CPU, and sat there until `sweep.js`'s `CASE_TIMEOUT` watchdog killed it. The supervisor
 * then found no in-flight marker - the last case had already cleared it - so it logged "child
 * failed before any case started", which reads like a harness bug rather than a finished run. The
 * results were complete and correct the whole time; only the wall clock was wrong.
*/
process.exit(0);
