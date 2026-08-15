/**
 * The measuring rig for the DataFrame-vs-DuckFrame comparison.
 *
 * **Every rule here exists because it changes the number.**
 *
 * 1. **Warm up, then take the MEDIAN of several runs.** The first call pays for DuckDB instance
 *    creation and V8 warm-up; a single timing at 1k rows is mostly that. The warm-up run is
 *    discarded and never reported.
 * 2. **`DuckFrame` is LAZY.** `select`/`filter`/`orderBy` only build SQL, so timing them measures
 *    string concatenation - microseconds, and meaningless. Every DuckFrame case here ends in
 *    something that forces execution, and `force()` is the only sanctioned way to do it.
 * 3. **Verify the two engines did the same work.** Each case returns a row count (or a value),
 *    and mismatches are reported as a warning in the output. A benchmark where one side quietly
 *    did less is worse than no benchmark.
 * 4. **`DataFrame` will run out of memory before `DuckFrame` does.** That is a RESULT, not a
 *    crash: an OOM or a throw is caught, recorded as such, and the scale continues with the
 *    other engine. Run with a big heap so the limit found is the real one, not an artificial
 *    2 GB default: `node --max-old-space-size=16384`.
 * 5. **Generation is never timed.** Records are built once per scale and handed to both engines.
*/
import { performance } from 'node:perf_hooks';

/**
 * Samples per case, by scale. Fewer at the top end is a measurement choice, not laziness: a
 * 5M-row operation takes seconds, so run-to-run variance is a much smaller fraction of it than
 * at 1k, where a millisecond of noise is the whole number. `RUNS=n` overrides it.
*/
export function runsFor(scale) {
    if (process.env.RUNS) return Number(process.env.RUNS);
    if (scale >= 3_000_000) return 1;
    if (scale >= 500_000) return 2;
    return 3;
}

export const RUNS = Number(process.env.RUNS || 3);

/** `--max-old-space-size` in MB, so the doc can say what heap the numbers came from. */
export function heapLimitMB() {
    const arg = process.execArgv.find((a) => a.startsWith('--max-old-space-size'));
    return arg ? Number(arg.split('=')[1]) : null;
}

/** What a single measured case reports. */
function result(ms, rows, note) {
    return { ms, rows, note };
}

export const SKIPPED = Symbol('skipped');

/**
 * Times `fn` `RUNS` times after one discarded warm-up, and returns the median.
 *
 * `fn` must return the number of rows it produced (or `SKIPPED`), which is what lets the report
 * check that both engines did equivalent work.
*/
export async function measure(fn, { warmup = true, runs = RUNS } = {}) {
    try {
        if (warmup) {
            const first = await fn();
            if (first === SKIPPED) return result(null, null, 'n/a');
        }

        const samples = [];
        let rows = null;

        for (let n = 0; n < runs; n++) {
            const start = performance.now();
            rows = await fn();
            samples.push(performance.now() - start);
        }

        samples.sort((a, b) => a - b);
        return result(samples[Math.floor(samples.length / 2)], rows);
    } catch (err) {
        const message = String(err?.message ?? err);
        const oom = /heap out of memory|Array buffer allocation failed|Invalid (string|array) length|Maximum call stack/i
            .test(message);
        return result(null, null, oom ? 'OOM' : `failed: ${message.slice(0, 60)}`);
    }
}

/**
 * Drains a `DuckFrame` so the work is actually done.
 *
 * **Which forcing method is correct depends on what is being measured**, and getting it wrong
 * silently measures nothing:
 *
 * - `'rows'` - stream every row out to JS. Use this when the DataFrame side also produces
 *   materialised JS values, so both pay for output conversion.
 * - `'count'` - `count(*)`. Cheapest honest force for a filter or a join, where the question is
 *   how fast the engine finds the rows, not how fast it hands them over. **Never use it for a
 *   sort**: `count(*)` lets the optimiser drop the ORDER BY entirely.
 * - `'table'` - `materialize()`. The right one for "produce a frame the next step can use",
 *   which is what `DataFrame`'s eager operations always do.
*/
export async function force(frame, how = 'table') {
    if (how === 'count') return frame.size();

    if (how === 'rows') {
        let seen = 0;

        for await (const _row of frame.rows()) seen++;
        return seen;
    }

    const table = await frame.materialize();
    const rows = await table.size();
    await table.destroy();
    return rows;
}

// ---------------------------------------------------------------- reporting

const PAD = 26;

export function heading(text) {
    // eslint-disable-next-line no-console
    console.log(`\n${'='.repeat(78)}\n${text}\n${'='.repeat(78)}`);
}

export function line(text = '') {
    // eslint-disable-next-line no-console
    console.log(text);
}

export function fmt(ms) {
    if (ms == null) return '-';
    if (ms >= 10_000) return `${(ms / 1000).toFixed(1)} s`;
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
    return `${ms.toFixed(1)} ms`;
}

export function rate(rows, ms) {
    if (ms == null || !rows) return '-';
    return `${Math.round(rows / (ms / 1000)).toLocaleString()}/s`;
}

/** `2.4x faster` / `1.8x slower`, from DuckFrame's point of view. */
export function speedup(dataFrameMs, duckFrameMs) {
    if (dataFrameMs == null || duckFrameMs == null) return '-';
    const factor = dataFrameMs / duckFrameMs;
    return factor >= 1 ? `**${factor.toFixed(1)}x faster**` : `${(1 / factor).toFixed(1)}x slower`;
}

/** One console row while a run is in progress, so a long run is watchable. */
export function progress(scale, name, df, duck) {
    const cell = (r) => (r.note ? r.note : fmt(r.ms)).padStart(12);
    line(`  ${String(scale).padEnd(8)}${name.padEnd(PAD)}${cell(df)}${cell(duck)}`
        + `   ${df.ms != null && duck.ms != null ? `${(df.ms / duck.ms).toFixed(1)}x` : ''}`);
}

export function progressHeader() {
    line(`  ${'scale'.padEnd(8)}${'case'.padEnd(PAD)}${'DataFrame'.padStart(12)}`
        + `${'DuckFrame'.padStart(12)}   ratio`);
}
