/**
 * Supervises a full sweep so a FATAL abort becomes a FINDING, not a hole in the report.
 *
 *     cd packages/data-mate && pnpm build
 *     node bench/comparison/sweep.js                 # every scale, both engines, then render
 *     SCALES=3000000,5000000 node bench/comparison/sweep.js
 *     HEAP=24576 CASE_TIMEOUT=1800 node bench/comparison/sweep.js
 *
 * **Why a supervisor exists.** `DataFrame.unique(fields)` at 3M does not throw - V8 prints
 * `FATAL ERROR: Ineffective mark-compacts near heap limit` and aborts the process (exit 134).
 * Nothing inside the runner can catch that, so a single-process sweep lost the 12 cases that came
 * after it, at 3M and again at 5M - including every ldjson case, both joins and all the
 * aggregations, which are the most compelling DuckFrame wins at exactly the scales that matter.
 *
 * So this process owns the loop instead:
 *
 * 1. Run `run.js` as a child, one scale and one ENGINE at a time. The engine split means a
 *    DataFrame abort cannot take DuckFrame's numbers with it.
 * 2. The child writes an in-flight marker naming the case it is about to measure.
 * 3. On a non-zero exit, read the marker, record THAT case's cell as an OOM for that engine, add
 *    it to the child's skip list, and restart from the next case.
 * 4. Repeat until the child exits cleanly, then render the report once.
 *
 * A child that stops producing output for `CASE_TIMEOUT` seconds is killed and recorded as hung -
 * a probe that registered UDFs once printed all its output and then never exited, and a sweep
 * must not wait five hours to find out.
 *
 * The lifecycle section is NOT measured here: every stage of it times both engines as a pair, so
 * it needs a process with both loaded. Run `SCALES=<small scales> node run.js` for that.
*/
import { spawn } from 'node:child_process';
import process from 'node:process';
import {
    loadResults, saveResults, indexRows, rowFor, withMismatch, keyOf,
    readInflight, clearInflight, RESULTS_FILE, INFLIGHT_FILE,
} from './lib/results.js';
import { SCALES, label } from './lib/generate.js';

const HEAP = Number(process.env.HEAP || 24576);
const CASE_TIMEOUT = Number(process.env.CASE_TIMEOUT || 1800) * 1000;
const ENGINES = (process.env.ENGINES || 'duckframe,dataframe').split(',');
const OUT = process.env.OUT || 'docs/PERFORMANCE.md';

/**
 * The runner this supervises. Overridable ONLY so the restart-after-death path can be tested with
 * a stub that dies on demand - reproducing a real V8 abort takes a multi-minute 5M run, and a
 * recovery path that is never exercised is a recovery path that does not work.
*/
const RUNNER = process.env.RUNNER || 'bench/comparison/run.js';

/**
 * DuckFrame first, deliberately: its numbers are the ones a DataFrame abort used to destroy, so
 * they are banked before the engine that dies is asked to run at all.
*/
for (const engine of ENGINES) {
    if (!['dataframe', 'duckframe'].includes(engine)) {
        throw new Error(`ENGINES must list 'dataframe' and/or 'duckframe', got ${engine}`);
    }
}

const log = (text) => {
    // eslint-disable-next-line no-console
    console.log(text);
};

/** Runs one child to completion, streaming its output, and returns how it ended. */
function runChild(env) {
    return new Promise((resolve) => {
        const child = spawn(
            process.execPath,
            [`--max-old-space-size=${HEAP}`, RUNNER],
            { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }
        );

        let last = Date.now();
        let timedOut = false;

        const watch = setInterval(() => {
            if (Date.now() - last < CASE_TIMEOUT) return;
            timedOut = true;
            child.kill('SIGKILL');
        }, 5000);

        const relay = (stream, to) => {
            stream.on('data', (chunk) => {
                last = Date.now();
                to.write(chunk);
            });
        };
        relay(child.stdout, process.stdout);
        relay(child.stderr, process.stderr);

        child.on('close', (code, signal) => {
            clearInterval(watch);
            resolve({ code, signal, timedOut });
        });
    });
}

/** The cell a death leaves behind: what happened, in the words the report already uses. */
function deathNote({ code, signal, timedOut }) {
    if (timedOut) return `hung (no output for ${CASE_TIMEOUT / 1000}s, killed)`;
    if (signal) return `killed (${signal})`;
    // exit 134 is V8's fatal OOM abort; anything else non-zero died for a reason we cannot see
    return code === 134 ? 'OOM (fatal abort)' : `died (exit ${code})`;
}

/** Records a death against the half that was in flight, so the report shows it as a result. */
function recordDeath(inflight, outcome) {
    const state = loadResults();
    const index = indexRows(state.rows);
    const row = rowFor(index, inflight);
    row[inflight.half] = { ms: null, rows: null, note: deathNote(outcome) };
    index.set(keyOf(inflight.scale, inflight.group, inflight.name), withMismatch(row));
    state.rows = [...index.values()];
    saveResults(state);
}

for (const scale of SCALES) {
    for (const engine of ENGINES) {
        const skip = [];

        // one restart per case at most: the loop can only advance by skipping a case that died
        for (let attempt = 0; ; attempt++) {
            log(`\n### ${label(scale)} | ${engine}`
                + `${skip.length ? ` | restart ${attempt}, skipping ${skip.length}` : ''}`);
            clearInflight();

            const outcome = await runChild({
                ENGINE: engine,
                SCALES: String(scale),
                SKIP: JSON.stringify(skip),
                RESULTS: RESULTS_FILE,
                INFLIGHT: INFLIGHT_FILE,
                OUT,
            });

            if (outcome.code === 0 && !outcome.signal) break;

            const inflight = readInflight();
            if (!inflight) {
                log(`  child failed before any case started (${deathNote(outcome)})`
                    + ' - nothing to attribute it to, moving on');
                break;
            }

            log(`  ${inflight.name} [${inflight.half}] ${deathNote(outcome)}`
                + ' - recorded as a result, continuing after it');
            recordDeath(inflight, outcome);
            skip.push(keyOf(inflight.scale, inflight.group, inflight.name));
            clearInflight();
        }
    }
}

log('\n### rendering');
await new Promise((resolve) => {
    const child = spawn(process.execPath, ['bench/comparison/render.js'], {
        env: { ...process.env, RESULTS: RESULTS_FILE, OUT, HEAP: `${HEAP} MB` },
        stdio: 'inherit',
    });
    child.on('close', resolve);
});
