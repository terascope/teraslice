/**
 * WHY does a checkpoint at 500k rows cost more than one at 2M?
 *
 * `checkpoint-cost.mjs` measured, reproducibly over two repeats: 100k -> 50 ms, **500k -> 495 ms**,
 * 1M -> 134 ms, 2M -> 276 ms, 5M -> 1,090 ms. Every point except 500k sits on a line. 500k is 4x
 * dearer than a table with FOUR TIMES the data, which cannot be the cost of compressing 500k rows.
 * So the number is measuring something other than size, and until that is named the whole curve is
 * suspect (correction §0.7: verify HOW you measure, not just what).
 *
 * Three candidates, and this separates them:
 *
 *  1. **Ordering.** 500k ran right after 100k in the same process. If a previous scale's database,
 *     buffers or fragmented free-list are still around, the number belongs to the sequence, not the
 *     size. Every trial here uses a fresh database, and `ONLY=` runs one shape per process.
 *  2. **Payload SIZE, not row count.** At 500k over 20 payloads each append is 25,000 rows - a fifth
 *     of a 122,880-row row group - so the table may end up as many partial row groups, and a
 *     checkpoint pays per row group rather than per row. At 2M the same 20 payloads are 100,000 rows
 *     each. Row-group and segment counts are reported for exactly this reason.
 *  3. **A mid-ingest automatic checkpoint.** At 500k, some segments were ALREADY compressed before
 *     the manual checkpoint (`Constant:84 BitPacking:59`), which no other scale showed. If DuckDB
 *     auto-checkpointed during ingest, the final one may be paying to redo a mixed table.
 *
 * So: the same ROW COUNT ingested as 1 / 4 / 20 / 40 payloads, at two row counts, each into a fresh
 * database, reporting row groups, segment counts and how many were compressed BEFORE the manual
 * checkpoint.
 *
 *     node packages/data-mate/docs/tools/probe/checkpoint-fragmentation.mjs
 *     ROWS=500000 PAYLOADS=20 ONLY=1 node .../checkpoint-fragmentation.mjs   # one shape, alone
*/
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import process from 'node:process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const ROW_COUNTS = (process.env.ROWS || '500000,2000000').split(',').map((s) => Number(s.trim()));
const PAYLOAD_COUNTS = (process.env.PAYLOADS || '1,4,20,40').split(',').map((s) => Number(s.trim()));
/** `ONLY=1` runs a single (ROWS, PAYLOADS) shape, so a number cannot inherit a previous trial. */
const ONLY = process.env.ONLY === '1';

/**
 * Whether DuckDB is allowed to checkpoint DURING ingest.
 *
 * **This is the thing the 500k anomaly turned out to be about.** `checkpoint_threshold` defaults to
 * 16 MiB, and a payload of the 30-column corpus is far bigger than that, so a COMMIT can trigger an
 * AUTOMATIC checkpoint - which compresses some of the table, charges its cost to `append`, and
 * leaves the table in a mixed state that the final manual checkpoint has to finish. How the work
 * splits between the two depends on payload size in a way that has nothing to do with the row count,
 * which is why a single "cost of a checkpoint" number was unstable at 500k and stable at 2M.
 *
 * So both modes are measured, and what is compared is the TOTAL - ingest plus the final checkpoint -
 * because that total is what the worker actually pays either way.
*/
const MODES = (process.env.MODES || 'default,auto-off').split(',').map((s) => s.trim());

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-frag-'));
const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

/** DuckDB's row group is 122,880 rows; a payload smaller than that cannot fill one. */
const ROW_GROUP = 122_880;

async function storage(frame, table) {
    const rows = await frame.query(
        `SELECT compression, count(*), count(DISTINCT row_group_id)
         FROM pragma_storage_info('${table}') GROUP BY 1`
    );
    const groups = await frame.query(
        `SELECT count(DISTINCT row_group_id) FROM pragma_storage_info('${table}')`
    );
    const segments = rows.reduce((sum, [, count]) => sum + Number(count), 0);
    const uncompressed = Number(rows.find(([scheme]) => scheme === 'Uncompressed')?.[1] ?? 0);
    const memory = Number(
        (await frame.query('SELECT sum(memory_usage_bytes) FROM duckdb_memory()'))[0][0] ?? 0
    );
    return {
        rowGroups: Number(groups[0][0] ?? 0),
        segments,
        uncompressed,
        compressed: segments - uncompressed,
        memoryMB: memory / 1024 ** 2,
    };
}

const results = [];

async function trial(rows, payloadCount, mode) {
    const perPayload = Math.floor(rows / payloadCount);

    // payloads first, in their own database, so nothing of the producer is alive during the measure
    const files = [];
    for (let n = 0; n < payloadCount; n++) {
        const producer = await DuckFrame.fromRecords(
            CONFIG, makeRecords(perPayload, n + 1), { name: `p${n}` }
        );
        const file = path.join(scratch, `r${rows}-c${payloadCount}-${n}.parquet`);
        await producer.writeParquet(file);
        await producer.destroy();
        files.push(file);
    }
    await closeDuckDatabase();

    const frame = await DuckFrame.create(CONFIG, { name: 'master' });
    const table = frame.table;
    if (mode === 'auto-off') await frame.query("SET checkpoint_threshold = '1TB'");

    const ingestStart = performance.now();
    for (const file of files) await frame.append({ parquet: file });
    const ingestMs = performance.now() - ingestStart;

    const before = await storage(frame, table);

    // armed, because a plain CHECKPOINT after the ingest path silently declines - see
    // probe/checkpoint-noop.mjs. The arm is a throwaway write and costs ~0 ms.
    const start = performance.now();
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    await frame.query('CHECKPOINT');
    const checkpointMs = performance.now() - start;

    const after = await storage(frame, table);
    const counted = Number((await frame.query(`SELECT count(*) FROM "${table}"`))[0][0]);

    results.push({
        rows, payloadCount, perPayload, mode, ingestMs, checkpointMs, before, after, counted
    });

    log(`  ${mode.padEnd(9)}${`${rows / 1000}k`.padStart(6)} in`
        + ` ${String(payloadCount).padStart(3)} x`
        + ` ${perPayload.toLocaleString().padStart(9)} rows`
        + ` (${(perPayload / ROW_GROUP).toFixed(2)} row groups each)`
        + `   ingest ${`${ingestMs.toFixed(0)} ms`.padStart(8)}`
        + `   CHECKPOINT ${`${checkpointMs.toFixed(0)} ms`.padStart(8)}`
        + `   TOTAL ${`${(ingestMs + checkpointMs).toFixed(0)} ms`.padStart(8)}`);
    log(`         before: ${before.rowGroups} row groups, ${before.segments} segments`
        + ` (${before.compressed} already compressed), ${before.memoryMB.toFixed(0)} MB`
        + `   ->  after: ${after.rowGroups} row groups, ${after.segments} segments`
        + ` (${after.uncompressed} uncompressed), ${after.memoryMB.toFixed(0)} MB`
        + `   rows ${counted.toLocaleString()}`);

    await frame.destroy();
    await closeDuckDatabase();
    for (const file of files) fs.rmSync(file, { force: true });
}

log(`\n${'-'.repeat(120)}`);
for (const mode of MODES) {
    for (const rows of ROW_COUNTS) {
        for (const payloadCount of PAYLOAD_COUNTS) {
            await trial(rows, payloadCount, mode);
            if (ONLY) break;
        }
        log('');
        if (ONLY) break;
    }
    if (ONLY) break;
}

log('='.repeat(110));
log('| auto-checkpoint | rows | payloads | rows/payload | pre-compressed segments | ingest |'
    + ' final CHECKPOINT | TOTAL |');
log('|---|---|---|---|---|---|---|---|');
for (const r of results) {
    log(`| ${r.mode} | ${r.rows.toLocaleString()} | ${r.payloadCount} |`
        + ` ${r.perPayload.toLocaleString()} | ${r.before.compressed} |`
        + ` ${r.ingestMs.toFixed(0)} ms | ${r.checkpointMs.toFixed(0)} ms |`
        + ` **${(r.ingestMs + r.checkpointMs).toFixed(0)} ms** |`);
}

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(0);
