/**
 * Timing and forcing helpers for the DataFrame-vs-TealFrame comparison.
 *
 * 1. Each case runs once as a warm-up, then the median of several runs is reported. The first
 *    call pays for DuckDB instance creation and V8 warm-up, which would dominate a 1k-row timing.
 * 2. `TealFrame` is lazy: `select`/`filter`/`orderBy` only build SQL. Every TealFrame case must
 *    end in `force()` so that the query actually runs.
 * 3. Each case returns a row count, and the report warns when the two engines disagree, so a
 *    faster result cannot come from doing less work.
 * 4. Running out of memory is a result, not a crash. Errors are caught and recorded, and the
 *    other engine still runs. Use a large heap (`node --max-old-space-size=16384`) so the limit
 *    found is the engine's, not Node's 2 GB default.
 * 5. Record generation is never timed.
*/
import { performance } from 'node:perf_hooks';

/**
 * Samples per case, by scale. Large scales take fewer samples because an operation that takes
 * seconds is less affected by run-to-run noise. `RUNS=n` overrides it.
*/
export function runsFor(scale) {
    if (process.env.RUNS) return Number(process.env.RUNS);
    if (scale >= 3_000_000) return 1;
    if (scale >= 500_000) return 2;
    return 3;
}

export const RUNS = Number(process.env.RUNS || 3);

/** `--max-old-space-size` in MB, so the report can state the heap limit. */
export function heapLimitMB() {
    const arg = process.execArgv.find((a) => a.startsWith('--max-old-space-size'));
    return arg ? Number(arg.split('=')[1]) : null;
}

/** What a single measured case reports. */
function result(ms, rows, note) {
    return { ms, rows, note };
}

/**
 * Turns a thrown error into the cell the report shows. Out-of-memory errors are reported as
 * `OOM`, since they mark the scale at which an engine stops working on this machine.
 *
 * Exported so that failures during setup are classified the same way as failures during timing;
 * `where` names the phase.
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
 * Runs a `TealFrame` query so the work is actually done. The right method depends on what is
 * being measured, and the wrong one can measure nothing:
 *
 * - `'rows'` streams every row out to JS. Use it when the DataFrame side also produces JS values,
 *   so both pay for output conversion.
 * - `'count'` runs `count(*)`. Use it for a filter or a join, where the question is how fast the
 *   rows are found. Never use it for a sort, because the optimizer drops the `ORDER BY`. Never
 *   use it on a frame from `fromParquet` either: DuckDB answers the count from the Parquet
 *   footer without reading any values.
 * - `'table'` runs `materialize()`. Use it when the operation must produce a frame the next step
 *   can use, which is what `DataFrame`'s eager operations always do.
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
 * `CHECKPOINT=1` compresses the TealFrame tables before a case is timed.
 *
 * An in-memory DuckDB table stays uncompressed until a checkpoint. Compression changes what a
 * scan reads and how often a UDF is called (once per dictionary entry per row group instead of
 * once per row), so the same case can change by two orders of magnitude. Run the sweep with and
 * without the flag, into separate `RESULTS` files, to compare per operation.
 *
 * The checkpoint is taken during setup, so it is never part of a timing.
*/
export const CHECKPOINT = ['1', 'true', 'yes'].includes(String(process.env.CHECKPOINT));

/**
 * `PREFER_SQL` chooses whether the TealFrame transforms run as native SQL or as JavaScript UDFs.
 *
 * Most function configs have a SQL implementation, and `tealFrameAdapter` uses it by default
 * without registering a UDF. A JavaScript UDF costs about 171 ns per value and runs
 * single-threaded, because the Node binding blocks DuckDB's worker thread until JS returns.
 *
 * `preferSql: false` on the adapter forces the UDF path for a function that has a SQL
 * implementation, so two runs measure the same work through the two paths:
 *
 *     RESULTS=bench/comparison/.udf.json PREFER_SQL=0 node bench/comparison/sweep.js
 *     RESULTS=bench/comparison/.sql.json PREFER_SQL=1 node bench/comparison/sweep.js
 *
 * Unset means the adapter's default, which is SQL. The value is a tri-state (unset, true, false)
 * so the report metadata can tell "not set" apart from "set to 1".
 *
 * It only affects cases that go through `duckAdapter`: the transform, validation, and composed
 * pipeline groups. In every other group, a difference between two runs is noise.
*/
export const PREFER_SQL = process.env.PREFER_SQL == null
    ? undefined
    : ['1', 'true', 'yes'].includes(String(process.env.PREFER_SQL));

/**
 * Checkpoints the database that holds the case's tables, checks that it compressed them, and
 * returns how long it took.
 *
 * `CHECKPOINT` is database-wide and each process has one database, so one call through the first
 * frame compresses every table the setup built, including both sides of a join. A setup that
 * returns no frame is skipped: the append cases build their table inside the timed work.
 *
 * After a series of Parquet appends, `CHECKPOINT` (and `FORCE CHECKPOINT`) can return immediately
 * without compressing anything and without an error. A write since the last checkpoint makes it
 * run, so this function does a throwaway `CREATE TABLE` and `DROP TABLE` first. It then checks
 * `pragma_storage_info` and throws if the table is still uncompressed, so the report never shows
 * an uncompressed result labeled as checkpointed.
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
    // a throwaway write so the checkpoint actually runs; it does not touch the data
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

/** `2.4x faster` / `1.8x slower`, from TealFrame's point of view. */
export function speedup(dataFrameMs, tealFrameMs) {
    if (dataFrameMs == null || tealFrameMs == null) return '-';
    const factor = dataFrameMs / tealFrameMs;
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
        + `${'TealFrame'.padStart(12)}   ratio`);
}
