/**
 * How big can ONE table get, what does it cost, and when should it be checkpointed?
 *
 * This is the heavy test. It streams payloads into a single table the way the worker really does -
 * `PER`-row Parquet payloads, `CONCURRENCY` appends in flight - and reports, separately:
 *
 *   - **generation time**, which is JavaScript building records and is NOT ingest. Reported on its
 *     own line so it can be subtracted; at ~1.5M rec/s it is the largest single cost at scale and
 *     would otherwise swamp everything.
 *   - **producer time** (`writeParquet`), the qpl-search-api leg.
 *   - **worker time** (`append`), the qpl-worker leg - the number that actually matters.
 *   - **checkpoint time**, charged separately again, with the compression it bought.
 *   - **RSS and on-disk size**, sampled at every checkpoint, which is the pair that decides the
 *     cadence: too rare and the process grows without bound, too often and ingest stalls.
 *
 * Run:
 *   node packages/data-mate/docs/tools/bench/scale-ingest.mjs
 *   TARGET=10000000 CHECKPOINT_EVERY=2000000 node .../scale-ingest.mjs
 *   TARGET=5000000 AUTO_CHECKPOINT=off node .../scale-ingest.mjs   # no COMMIT can checkpoint
 *   TARGET=1000000000 PER=100000 CONCURRENCY=10 CHECKPOINT_EVERY=50000000 \
 *     DB=/tmp/duck-scale.db node .../scale-ingest.mjs
 *
 * `DB` defaults to a FILE, not `:memory:` - a billion rows does not fit in 36 GB, and the point of
 * the exercise is what the table costs on disk. Parquet payloads are deleted as soon as they are
 * appended, so the run needs disk for the database only.
 *
 * Requires the build: `npx tsc -b` in packages/data-mate.
 */
import { rm, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { duckFrame, since, heading, note } from '../lib/duck.mjs';

const TARGET = Number(process.env.TARGET || 5_000_000);
const PER = Number(process.env.PER || 100_000);
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);
/** 0 disables periodic checkpointing entirely, which is the control. */
const CHECKPOINT_EVERY = Number(process.env.CHECKPOINT_EVERY ?? 0);
/**
 * Whether DuckDB's AUTOMATIC checkpointing is left armed - and it is a confound, not a detail.
 *
 * `checkpoint_threshold` defaults to 16 MiB, so a COMMIT inside `append` can trigger a checkpoint
 * that compresses the table, and that compression is then charged to the timed append. This bench
 * never suppressed it, `append-ingest.mjs` always does, and the two disagreed on ingest cost by
 * 1.48 s/M against 892 ms/M with table size ruled out as the cause. `AUTO_CHECKPOINT=off` raises
 * the threshold out of reach so no COMMIT can trigger one, which is the only way to tell whether
 * automatic checkpointing is what the gap was made of.
 */
const AUTO_CHECKPOINT = process.env.AUTO_CHECKPOINT || 'on';
const DB = process.env.DB || '/tmp/duck-scale.db';
const SPOOL = process.env.SPOOL || '/tmp/duck-scale-spool';
/** Unset = let DuckDB use as much as it likes, which is the default and is not a number. */
const MEMORY_LIMIT = process.env.MEMORY_LIMIT || '';

const { DuckFrame, closeDuckDatabase, configureDuckDatabase } = await duckFrame();
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(0)} MB`;
const num = (n) => Math.round(n).toLocaleString();

/** Bytes on disk for the database, including the WAL. */
async function dbBytes() {
    let total = 0;
    for (const suffix of ['', '.wal']) {
        try { total += (await stat(DB + suffix)).size; } catch { /* not created yet */ }
    }
    return total;
}

/**
 * How much of the table is still uncompressed.
 *
 * The pair that says whether a checkpoint actually did anything - see `append-ingest.mjs` for why
 * a `CHECKPOINT` that returns in 0 ms having compressed nothing is a real hazard.
 */
async function segments(frame, table) {
    const rows = await frame.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}') GROUP BY 1`
    );
    const counts = Object.fromEntries(rows.map(([kind, n]) => [kind, Number(n)]));
    const uncompressed = counts.Uncompressed ?? 0;
    const all = Object.values(counts).reduce((a, b) => a + b, 0);
    return { uncompressed, all };
}

async function main() {
    for (const path of [DB, `${DB}.wal`]) if (existsSync(path)) await rm(path);
    await rm(SPOOL, { recursive: true, force: true });
    await mkdir(SPOOL, { recursive: true });

    heading(`SCALE: ${num(TARGET)} rows, ${num(PER)} per payload, ${CONCURRENCY} appends in flight`);
    note(`database ${DB}`);
    note(CHECKPOINT_EVERY
        ? `checkpoint every ${num(CHECKPOINT_EVERY)} rows`
        : 'no periodic checkpoint (the control)');

    /**
     * `MEMORY_LIMIT` turns RAM from something EMERGENT into something CONFIGURED.
     *
     * Left unset, RSS is whatever DuckDB's buffer manager happens to hold - measured at 244M rows
     * it wandered between 3.8 and 12.7 GiB with no stable trend, which is not a number anyone can
     * size a container from. Setting it makes DuckDB spill to `temp_directory` instead of growing,
     * so the question becomes "how much do you want to give it" and the answer is a policy.
    */
    if (MEMORY_LIMIT) {
        await configureDuckDatabase({
            database: DB,
            memoryLimit: MEMORY_LIMIT,
            tempDirectory: SPOOL,
            maxTempDirectorySize: process.env.MAX_TEMP || '200GB',
        });
        note(`memory_limit ${MEMORY_LIMIT}, spilling to ${SPOOL}`);
    }

    const frame = await DuckFrame.create(CONFIG, { name: 'scale', database: DB });
    const table = frame.table ?? 'scale';

    if (AUTO_CHECKPOINT === 'off') {
        await frame.query("SET checkpoint_threshold = '1TB'");
        note('automatic checkpointing SUPPRESSED - no COMMIT can charge compression to an append');
    } else {
        note("automatic checkpointing ARMED (checkpoint_threshold at DuckDB's 16 MiB default)");
    }

    const cost = { generate: 0, produce: 0, append: 0, checkpoint: 0 };
    const samples = [];
    let done = 0;
    let sinceCheckpoint = 0;
    let seed = 1;
    const started = process.hrtime.bigint();

    while (done < TARGET) {
        const wave = Math.min(CONCURRENCY, Math.ceil((TARGET - done) / PER));
        const paths = [];

        // --- generate: JavaScript only. NOT ingest, and reported separately. ---
        let mark = process.hrtime.bigint();
        const batches = [];
        for (let n = 0; n < wave; n++) {
            const rows = Math.min(PER, TARGET - done - n * PER);
            if (rows > 0) batches.push(makeRecords(rows, seed++));
        }
        cost.generate += since(mark);

        // --- producer: the qpl-search-api leg ---
        mark = process.hrtime.bigint();
        await Promise.all(batches.map(async (records, n) => {
            const path = join(SPOOL, `p${done}-${n}.parquet`);
            const payload = await DuckFrame.fromRecords(CONFIG, records, { name: `p_${done}_${n}` });
            try {
                await payload.writeParquet(path);
            } finally {
                await payload.destroy();
            }
            paths.push(path);
        }));
        cost.produce += since(mark);

        // --- worker: N appends in flight against ONE table ---
        mark = process.hrtime.bigint();
        await Promise.all(paths.map((path) => frame.append({ parquet: path })));
        cost.append += since(mark);

        const added = batches.reduce((a, b) => a + b.length, 0);
        done += added;
        sinceCheckpoint += added;
        await Promise.all(paths.map((path) => rm(path, { force: true })));

        if (CHECKPOINT_EVERY && sinceCheckpoint >= CHECKPOINT_EVERY) {
            const before = await segments(frame, table);
            mark = process.hrtime.bigint();
            await frame.query('CHECKPOINT');
            const ms = since(mark);
            cost.checkpoint += ms;
            const after = await segments(frame, table);
            samples.push({
                rows: done,
                rss: process.memoryUsage().rss,
                disk: await dbBytes(),
                ms,
                before: before.uncompressed,
                after: after.uncompressed,
            });
            note(`${num(done)} rows | checkpoint ${ms.toFixed(0)} ms`
                + ` | uncompressed ${before.uncompressed} -> ${after.uncompressed}`
                + ` | rss ${mb(process.memoryUsage().rss)} | disk ${mb(await dbBytes())}`);
            sinceCheckpoint = 0;
        } else if (done % (PER * CONCURRENCY * 20) === 0) {
            note(`${num(done)} rows | rss ${mb(process.memoryUsage().rss)}`
                + ` | disk ${mb(await dbBytes())}`);
        }
    }

    const wall = since(started);

    heading('COST, by phase');
    const ingest = cost.produce + cost.append;
    const row = (label, ms) => note(
        `${label.padEnd(34)}${(ms / 1000).toFixed(1).padStart(8)} s`
        + `${num(TARGET / (ms / 1000)).padStart(16)} rows/s`
    );
    row('generate (JavaScript, NOT ingest)', cost.generate);
    row('produce  (writeParquet)', cost.produce);
    row('append   (worker, into one table)', cost.append);
    if (cost.checkpoint) row('checkpoint (periodic)', cost.checkpoint);
    note('');
    row('INGEST (produce + append)', ingest);
    note(`wall clock ${(wall / 1000).toFixed(1)} s,`
        + ` of which generation is ${(100 * cost.generate / wall).toFixed(0)}%`);

    heading('FINAL STATE');
    const finalSegments = await segments(frame, table);
    note(`rows              ${num(await frame.size())}`);
    note(`disk              ${mb(await dbBytes())}`);
    note(`process rss       ${mb(process.memoryUsage().rss)}`);
    note(`segments          ${finalSegments.all} (${finalSegments.uncompressed} uncompressed)`);

    heading('QUERIES on the finished table');
    for (const [label, run] of [
        ['count(*)', () => frame.query(`SELECT count(*) FROM "${table}"`)],
        ['filter + count', () => frame.query(
            `SELECT count(*) FROM "${table}" WHERE "category" = 'alpha'`
        )],
        ['group by 1 key', () => frame.query(
            `SELECT "category", count(*) FROM "${table}" GROUP BY 1`
        )],
        ['sort + limit 1000', () => frame.query(
            `SELECT "_key" FROM "${table}" ORDER BY "score" DESC LIMIT 1000`
        )],
        ['distinct 1 column', () => frame.query(`SELECT count(DISTINCT "name") FROM "${table}"`)],
    ]) {
        const mark = process.hrtime.bigint();
        await run();
        note(`${label.padEnd(22)}${since(mark).toFixed(0).padStart(8)} ms`);
    }

    if (samples.length > 1) {
        heading('CHECKPOINT CADENCE: what each one cost and bought');
        note('rows            ms      uncompressed      rss       disk');
        for (const s of samples) {
            note(`${num(s.rows).padStart(13)}${s.ms.toFixed(0).padStart(8)}`
                + `      ${String(s.before).padStart(6)} -> ${String(s.after).padEnd(6)}`
                + `${mb(s.rss).padStart(9)}${mb(s.disk).padStart(11)}`);
        }
    }

    await frame.destroy();
    await closeDuckDatabase(DB);
    await rm(SPOOL, { recursive: true, force: true });
}

await main();
process.exit(0);
