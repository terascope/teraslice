/**
 * INGEST, end to end, through the real `DuckFrame` - both tiers.
 *
 * The flow being measured (docs/HANDOFF.md §0.0):
 *
 *   qpl-search-api   Elasticsearch records -> fromRecords -> writeParquet   <- the PRODUCER
 *   qpl-worker       many Parquet payloads -> create() + append() -> ONE table  <- the CONSUMER
 *
 * The split is the point: coercion happens once, on the producer, and Parquet carries the types
 * so the worker re-validates nothing. Expect worker ingest to be a small fraction of producer
 * cost - if it is not, something has regressed.
 *
 * Also measures the three ways a worker can take N payloads, because they differ by ~4x:
 * one append per payload, all appends concurrent, or one append given every path.
 *
 * Run:   node packages/data-mate/docs/tools/bench/append-ingest.mjs
 * Scale: PAYLOADS=40 PER=100000 node .../append-ingest.mjs
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 *
 * **Every worker measurement is taken TWICE - with DuckDB's automatic checkpointing at its default
 * 16 MiB threshold, and with it suppressed - because an automatic checkpoint fires INSIDE `append`
 * and its cost is charged to ingest.** Measured on the 30-column corpus (2026-08-19): at 500k rows
 * over 20 payloads that inflated ingest from 688 ms to 1,033 ms, and over 40 payloads from 759 ms to
 * 1,893 ms, while at 1M-10M it never fired and changed nothing. So an ingest number taken without
 * checking is not a number: it may include compression work that a later `CHECKPOINT` would otherwise
 * do. Each run reports how many segments arrived already compressed, which is how you can tell.
*/
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync, existsSync, statSync } from 'node:fs';
import { duckFrame, since, rate, heading, note } from '../lib/duck.mjs';

const { DuckFrame, closeDuckDatabase } = await duckFrame();

/**
 * `DB=/tmp/x.db` measures the FILE-backed path instead of in-memory.
 *
 * Storage is a real axis, not a detail: measured 2026-08-21 on the 30-column corpus, file-backed
 * append cost 1.6x in-memory (892 vs 565 ms per million) and it changed which levers win - a CTAS
 * was the fastest table build in memory and the slowest on disk. The worker's table is file-backed
 * at any size that matters, so a number taken only in memory is the optimistic half.
*/
const DB = process.env.DB || undefined;

const PAYLOADS = Number(process.env.PAYLOADS || 20);
const PER = Number(process.env.PER || 50_000);
const TOTAL = PAYLOADS * PER;

/**
 * Automatic-checkpoint modes to measure. `MODES=default` or `MODES=auto-off` for just one.
 *
 * `auto-off` raises `checkpoint_threshold` out of reach so no COMMIT can trigger a checkpoint, which
 * is what the worker should do while ingesting: compress once, at quiesce, not repeatedly mid-fetch.
*/
const MODES = (process.env.MODES || 'default,auto-off').split(',').map((s) => s.trim());

/**
 * `preserve_insertion_order`, as a measured axis - and it is the one that matters most here.
 *
 * **Why it is crossed with the append shape rather than tested once.** Measured 2026-08-21 over 40
 * payloads, turning it off changed NOTHING when each payload is its own append, and appeared to be
 * worth ~3x when all payloads go into ONE append. That reads as an interaction: 40 separate
 * statements each order 50k rows, which is cheap, while one statement must establish a total order
 * across every file. But that ~3x came from a cell that ALSO dropped BEGIN/COMMIT, so it is an
 * inference, not a measurement. This cross isolates it - `DuckFrame.append` always wraps its work in
 * a transaction, so running through it holds that constant at what ships.
 *
 * **Why it is a legitimate thing to turn off.** The worker's fetches land in whatever order they
 * complete, so insertion order is already not the search order; where an ordering is needed the query
 * carries an ORDER BY. `SET GLOBAL` is required rather than a plain `SET`: `append` takes its OWN
 * connection per call (a DuckDB transaction belongs to a connection - see HANDOFF.md §CONCURRENT
 * APPENDS), so a session-scoped setting would never reach the connection doing the insert.
*/
const ORDERS = (process.env.ORDERS || 'on,off').split(',').map((s) => s.trim());

/** Deliberately not all-scalar: IP, Date and an array each cost real coercion work. */
const CONFIG = {
    version: 1,
    fields: {
        _key: { type: 'Keyword' },
        bytes: { type: 'Integer' },
        ip: { type: 'IP' },
        created: { type: 'Date' },
        tags: { type: 'Keyword', array: true },
    },
};

function records(prefix, count) {
    return Array.from({ length: count }, (_unused, i) => ({
        _key: `${prefix}-${i}`,
        bytes: i % 100_000,
        ip: `10.0.${i % 255}.${(i * 7) % 255}`,
        created: '2026-08-14T00:00:00.000Z',
        tags: ['a', 'b'],
    }));
}

const files = [];
const line = (label, ms, rows) => note(
    `${label.padEnd(34)}${`${ms.toFixed(0)} ms`.padStart(9)}  ${rate(rows, ms).padStart(14)}`
);

try {
    // ---------------------------------------------------------------- producer
    heading(`PRODUCER (qpl-search-api): ${TOTAL.toLocaleString()} rows -> ${PAYLOADS} payloads`);

    let mark = process.hrtime.bigint();
    for (let n = 0; n < PAYLOADS; n++) {
        const path = join(tmpdir(), `bench-ingest-${n}-${process.pid}.parquet`);
        const producer = await DuckFrame.fromRecords(CONFIG, records(`p${n}`, PER), {});
        await producer.writeParquet(path);
        await producer.destroy();
        files.push(path);
    }
    const produced = since(mark);
    const wire = files.reduce((sum, f) => sum + statSync(f).size, 0);

    line('fromRecords + writeParquet', produced, TOTAL);
    note(`${''.padEnd(34)}wire = ${(wire / 1024 / 1024).toFixed(1)} MB`
        + ` (${(wire / TOTAL).toFixed(1)} bytes/row)`);

    // ---------------------------------------------------------------- consumer
    heading(`WORKER (qpl-worker): ${PAYLOADS} payloads -> ONE table`);

    /**
     * Runs one shape, and reports whether an automatic checkpoint fired during it.
     *
     * The compressed-segment count is not decoration: a run where it is non-zero spent part of its
     * time compressing, so its ingest figure is not comparable with one where it is zero.
    */
    const run = async (mode, order, label, fn) => {
        const frame = await DuckFrame.create(CONFIG, { name: 'bench', database: DB });
        if (mode === 'auto-off') await frame.query("SET checkpoint_threshold = '1TB'");
        // GLOBAL, not session: `append` uses its own connection per call
        await frame.query(`SET GLOBAL preserve_insertion_order = ${order === 'on'}`);

        const start = process.hrtime.bigint();
        await fn(frame);
        const ms = since(start);

        const rows = await frame.size();
        if (rows !== TOTAL) throw new Error(`${label}: got ${rows} rows, expected ${TOTAL}`);

        const compressed = Number((await frame.query(
            `SELECT count(*) FROM pragma_storage_info('${frame.table}')`
            + " WHERE compression != 'Uncompressed'"
        ))[0][0] ?? 0);

        await frame.destroy();
        line(`${label} [${mode}, order ${order}]`, ms, TOTAL);
        if (compressed) {
            note(`${''.padEnd(34)}${compressed} segment(s) already compressed`
                + ' - an automatic checkpoint fired inside append');
        }
        return ms;
    };

    const grid = {};
    for (const mode of MODES) {
        for (const order of ORDERS) {
            note('');
            const sequential = await run(mode, order, 'append per payload, in turn', async (frame) => {
                for (const path of files) await frame.append({ parquet: path });
            });
            const concurrent = await run(mode, order, 'append per payload, CONCURRENT', async (frame) => {
                await Promise.all(files.map((path) => frame.append({ parquet: path })));
            });
            const batched = await run(mode, order, 'ONE append, all paths', async (frame) => {
                await frame.append({ parquet: files });
            });
            grid[`${mode}/${order}`] = { sequential, concurrent, batched };

            note('');
            note(`[${mode}, order ${order}] concurrent is ${(sequential / concurrent).toFixed(1)}x`
                + ` sequential; one append is ${(sequential / batched).toFixed(1)}x`);
            note(`[${mode}, order ${order}] per append, sequential:`
                + ` ${(sequential / PAYLOADS).toFixed(1)} ms for ${PER.toLocaleString()} rows`
                + ` - the number to compare against DataFrame.appendAll's ~0.2 ms`);
            note(`[${mode}, order ${order}] worker ingest is`
                + ` ${((batched / produced) * 100).toFixed(1)}%-`
                + `${((sequential / produced) * 100).toFixed(1)}% of producer cost`);
        }
    }

    /**
     * The interaction, stated per shape.
     *
     * This is the whole point of the cross: if `preserve_insertion_order` only matters for the ONE
     * append shape, then the cheap shape and the order-off setting have to be taken together, and
     * "batching everything is slower" was never about batching.
    */
    heading('preserve_insertion_order, per append shape');
    for (const mode of MODES) {
        const on = grid[`${mode}/on`];
        const off = grid[`${mode}/off`];
        if (!on || !off) continue;
        for (const shape of ['sequential', 'concurrent', 'batched']) {
            const ratio = on[shape] / off[shape];
            note(`[${mode}] ${shape.padEnd(11)} order on ${on[shape].toFixed(0).padStart(6)} ms`
                + ` -> off ${off[shape].toFixed(0).padStart(6)} ms`
                + `   ${ratio >= 1.05 ? `${ratio.toFixed(2)}x FASTER with order off`
                    : ratio <= 0.95 ? `${(1 / ratio).toFixed(2)}x slower with order off` : 'no change'}`);
        }
    }

    // ------------------------------------------------- records append, for contrast
    heading('RECORDS append (the api-server path, coercion included)');
    const batch = records('r', PER);
    const frame = await DuckFrame.create(CONFIG, { name: 'bench_records' });
    mark = process.hrtime.bigint();
    for (let n = 0; n < 4; n++) await frame.append({ records: batch });
    line('append({ records }) x4', since(mark), PER * 4);
    await frame.destroy();
} finally {
    for (const path of files) if (existsSync(path)) unlinkSync(path);
    await closeDuckDatabase();
}
