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

/**
 * Turns a thrown error into the cell the report shows.
 *
 * **An OOM is a RESULT, not a crash** - it is the scale at which an engine stops working on this
 * machine, and reporting it is the point. Exported because a failure in a case's SETUP has to be
 * classified the same way as one in the measurement: at 5M the dfjson payload cannot be built at
 * all, and `setup failed` in that cell would read as a harness bug rather than the engine's
 * ceiling. `where` names the phase, so the two are still distinguishable.
*/
export function classify(err, where) {
    const message = String(err?.message ?? err);
    const oom = /heap out of memory|Array buffer allocation failed|Invalid (string|array) length|Maximum call stack/i
        .test(message);
    if (oom) return result(null, null, where ? `OOM (${where})` : 'OOM');
    return result(null, null, `${where ? `${where} ` : ''}failed: ${message.slice(0, 60)}`);
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
        return classify(err);
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
 *   sort**: `count(*)` lets the optimiser drop the ORDER BY entirely. **Never use it on a frame
 *   from `fromParquet` either**: that frame is relation-backed, and DuckDB answers the count from
 *   the Parquet footer's row-group metadata without reading a single value - it reported 0 ms at
 *   500k rows, and a 5,939x speedup, for work that never happened.
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

// ---------------------------------------------------------------- checkpointing

/**
 * `CHECKPOINT=1` compresses the DuckFrame side's tables before a case is timed.
 *
 * **A measured DIMENSION of the comparison, not a tweak.** An in-memory DuckDB table stays
 * `Uncompressed` until a checkpoint, and every number in `docs/PERFORMANCE.md` was taken in that
 * state. Compressing changes what a scan has to read, and how often a UDF is called - once per
 * dictionary entry per row group instead of once per row - so the same case can move by two orders
 * of magnitude. Running the sweep twice, `CHECKPOINT=0` and `CHECKPOINT=1` into separate `RESULTS`
 * files, is how the payback is established PER OPERATION, which is what a policy needs.
 *
 * The checkpoint is taken in SETUP, so it never lands inside a timing. Its cost belongs to the
 * ingest side of the ledger and is measured on its own, per size, by
 * `docs/tools/bench/checkpoint-cost.mjs`.
*/
export const CHECKPOINT = ['1', 'true', 'yes'].includes(String(process.env.CHECKPOINT));

/**
 * `PREFER_SQL` chooses which EXECUTION PATH the DuckFrame side's transforms take.
 *
 * **The second measured dimension of this comparison, and the one this document was missing.**
 * 188 of the 205 function configs now carry a `sql` emission, so `duckFrameAdapter` returns native
 * SQL and registers no UDF at all; before that work every function ran as a vectorized JavaScript
 * UDF at a measured ~171 ns per value, single-threaded, because the node binding blocks DuckDB's
 * worker thread until JS returns. Every transform number in `docs/PERFORMANCE.md` was taken on the
 * UDF path and is therefore a lower bound by an unknown margin - which is what this flag exists to
 * quantify.
 *
 * `preferSql: false` on the adapter forces the UDF path for a function that HAS an emission, so the
 * two runs measure the same work through the two paths:
 *
 *     RESULTS=bench/comparison/.udf.json PREFER_SQL=0 node bench/comparison/sweep.js
 *     RESULTS=bench/comparison/.sql.json PREFER_SQL=1 node bench/comparison/sweep.js
 *
 * Unset means "the adapter's own default", which is SQL - so an ordinary run measures what ships.
 * Only `PREFER_SQL=0` changes behaviour; it is written as an explicit tri-state rather than a
 * boolean so that "not set" and "set to 1" are not silently the same code path as each other in the
 * report metadata.
 *
 * It affects ONLY the cases that go through `duckAdapter`: the transform, validation and composed
 * pipeline groups. Creation, filters, sorts, paging, output, group-bys, appends and joins
 * involve no UDF and are untouched, so a difference there between two runs is noise, not
 * signal.
*/
export const PREFER_SQL = process.env.PREFER_SQL == null
    ? undefined
    : ['1', 'true', 'yes'].includes(String(process.env.PREFER_SQL));

/**
 * Checkpoints the database the case's tables live in, VERIFIES that it happened, and returns what
 * it cost.
 *
 * **One call, not one per frame.** `CHECKPOINT` is database-wide and there is one database per
 * process here, so issuing it through the first frame found compresses every table the setup
 * built - including both sides of a join.
 *
 * A setup that produces no frame is left alone, and that is correct rather than a gap: the append
 * cases hand over Parquet paths and build their table INSIDE the measurement, so there is nothing
 * to compress before the work being timed has created it.
 *
 * **Arming and verifying are not belt-and-braces; without them this function measures nothing at
 * some sizes.** Measured (`docs/tools/bench/checkpoint-cost.mjs`, `probe/checkpoint-noop.mjs`):
 * after 20 Parquet appends at 1M and 2M rows, `CHECKPOINT` returns in 0 ms with every segment still
 * `Uncompressed`, and `FORCE CHECKPOINT` does the same. No error either way. A real WRITE since the
 * last checkpoint is what arms it - another append, a one-row insert, or a throwaway `CREATE TABLE`
 * + `DROP TABLE`; reads, waiting, an empty transaction and a no-match `DELETE` all leave it
 * disabled. A silently uncompressed table would put a `CHECKPOINT=1` number in the report that was
 * measured without a checkpoint, which is worse than no number, so a checkpoint that cannot be
 * verified THROWS and the cell records it.
*/
export async function checkpointTables(prepared) {
    if (!CHECKPOINT || !prepared) return 0;

    const frames = Object.values(prepared).filter(
        (value) => value && typeof value.query === 'function'
    );
    const frame = frames[0];
    if (!frame) return 0;

    const table = frames.find((value) => value.table)?.table;
    const uncompressed = async () => {
        if (!table) return null;
        const rows = await frame.query(
            `SELECT count(*) FROM pragma_storage_info('${table}') WHERE compression = 'Uncompressed'`
        );
        return Number(rows[0][0] ?? 0);
    };

    const before = await uncompressed();

    const start = performance.now();
    // the write that arms the checkpoint - cheapest one with no effect on the data
    await frame.query('CREATE OR REPLACE TABLE _bench_checkpoint_arm (a INTEGER)');
    await frame.query('DROP TABLE _bench_checkpoint_arm');
    await frame.query('CHECKPOINT');
    const ms = performance.now() - start;

    const after = await uncompressed();
    if (before && after >= before) {
        throw new Error(
            `CHECKPOINT did not compress "${table}": ${before} uncompressed segments before,`
            + ` ${after} after. The number would be an uncompressed measurement mislabelled as a`
            + ' checkpointed one.'
        );
    }

    return ms;
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
