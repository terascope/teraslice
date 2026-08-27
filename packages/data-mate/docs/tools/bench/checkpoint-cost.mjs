/**
 * What does a `CHECKPOINT` COST, as a function of size - and can it be paid more than once?
 *
 * `checkpoint-strategy.mjs` answered *which* strategy wins at 5M rows: build in memory, one
 * checkpoint at the end. It did NOT answer the two questions a policy needs:
 *
 *   1. **How does the cost scale?** "~200 ms per 1M rows" was extrapolated from a single 5M point.
 *      If it is linear in rows the policy is a row threshold; if it is superlinear, a big table
 *      cannot afford it at all.
 *   2. **Is a SECOND checkpoint incremental, or does it redo the whole table?** This decides
 *      whether "checkpoint once ingest is quiesced" is a hard constraint or merely the cheapest
 *      option. If a re-checkpoint only compresses the new blocks, a frame can checkpoint whenever
 *      it is asked a question and stay correct as more payloads land. If it redoes everything,
 *      checkpointing before the last fetch is a real waste and the API must not invite it.
 *
 * Both are measured per scale, on the real ingest path (`create` + N Parquet `append`s), with the
 * answer re-checked after every checkpoint so a cheaper number cannot be a wrong one.
 *
 * Also measured, because they separate "cost of rows" from "cost of bytes":
 *
 *   - an immediate REPEAT checkpoint with nothing dirty - the floor of the call
 *   - the same row count over 3 columns instead of 30 - whether cost tracks columns or rows
 *
 *     SCALES=100000,500000,1000000,2000000,5000000 PAYLOADS=20 \
 *       node packages/data-mate/docs/tools/bench/checkpoint-cost.mjs
 *
 * Prints a markdown table at the end, ready to paste into HANDOFF.md.
 *
 * **What it found, so a re-run has something to disagree with:**
 *
 *   - **~80 ms fixed plus ~150-250 ms per 1M rows** at 30 columns, 100k to 10M. Not superlinear.
 *   - A repeat with nothing dirty is **free**; a re-checkpoint after **5% more rows costs 10-40% of a
 *     full one**. So the cost is per CHECKPOINT, not per new row - checkpoint once, at quiesce.
 *   - Cost tracks **bytes**: 3 of the 30 columns, same rows, is 5-73 ms against 90-1,593 ms.
 *   - Memory falls **4.7-5.4x** at every size.
 *   - Two traps that had to be handled to get any of the above - see `AUTO` below and the arming
 *     comment on `arm()`: the call declines silently unless a write arms it, and DuckDB
 *     auto-checkpoints during ingest at some payload shapes, which costs more than it saves.
*/
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;
const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const SCALES = (process.env.SCALES || '100000,500000,1000000,2000000,5000000')
    .split(',').map((s) => Number(s.trim()));
const PAYLOADS = Number(process.env.PAYLOADS || 20);
const REPEATS = Number(process.env.REPEATS || 1);

/**
 * Whether DuckDB may checkpoint DURING ingest. **Off by default here, and that is not a thumb on
 * the scale - leaving it on measures the wrong thing.**
 *
 * `checkpoint_threshold` defaults to 16 MiB, so at some payload shapes a COMMIT inside `append`
 * triggers an AUTOMATIC checkpoint. That charges compression time to ingest, and leaves the table
 * half-compressed so the final manual checkpoint pays to finish a mixed table. Measured at 500k rows
 * over 20 payloads: 241 segments already compressed, ingest 1,033 ms, final checkpoint **500 ms** -
 * four times the cost of checkpointing 2M rows. With auto-checkpointing suppressed the same shape is
 * ingest 720 ms + checkpoint **148 ms**, in line with every other scale, and the TOTAL falls from
 * 1,533 ms to 868 ms. So the auto-checkpoint is a loss on both halves, and `AUTO=default` exists only
 * to reproduce that (`probe/checkpoint-fragmentation.mjs` is the full matrix).
*/
const AUTO = process.env.AUTO || 'off';

/** The 3 columns the narrow comparison keeps: one string, one integer, one date. */
const NARROW = ['category', 'count', 'created'];

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-ckptcost-'));
const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

const ms = (value) => `${value.toFixed(0)} ms`;
const mb = (bytes) => bytes / 1024 ** 2;

async function timed(fn) {
    const start = performance.now();
    const value = await fn();
    return { ms: performance.now() - start, value };
}

/** DuckDB's own accounting, not RSS: what the buffer manager is holding for us. */
async function duckMemoryMB(frame) {
    const rows = await frame.query('SELECT sum(memory_usage_bytes) FROM duckdb_memory()');
    return mb(Number(rows[0][0] ?? 0));
}

/**
 * The compression state of the table, as a FACT rather than an inference.
 *
 * **A checkpoint that did nothing looks exactly like a cheap one** - it returns without error, in
 * about 0 ms - so the segment count is the only way to tell them apart, and every timing here is
 * paired with it. Two of six scales silently declined the first time this ran, which is why.
*/
async function compression(frame, table) {
    const rows = await frame.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}')
         GROUP BY 1 ORDER BY 2 DESC`
    );
    const total = rows.reduce((sum, [, count]) => sum + Number(count), 0);
    const uncompressed = Number(rows.find(([scheme]) => scheme === 'Uncompressed')?.[1] ?? 0);
    return {
        uncompressed,
        compressed: total - uncompressed,
        schemes: rows.slice(0, 3).map(([scheme, count]) => `${scheme}:${count}`).join(' '),
    };
}

/**
 * **Re-arms the checkpoint, because after the ingest path it is silently disabled.**
 *
 * Measured, deterministically, at 1M and 2M rows over 20 Parquet payloads: `CHECKPOINT` returns in
 * 0 ms with every segment still `Uncompressed`, and so does `FORCE CHECKPOINT`. Neither errors.
 * Waiting does not help (polled for 2 s), nor does `SELECT 1`, nor reading the table, nor an empty
 * `BEGIN`/`COMMIT`, nor a `DELETE` matching no rows. What DOES arm it is any real WRITE since the
 * last checkpoint - another `append`, a one-row `INSERT`, or a `CREATE TABLE` + `DROP TABLE` of a
 * throwaway - after which the checkpoint runs and compresses the whole table (2,682 uncompressed
 * segments -> 11, 657 MB -> 120 MB).
 *
 * So this creates and drops a one-column table, which is the cheapest write that has no effect on
 * the data, and it is TIMED and reported: a policy has to include what arming costs.
 *
 * Any `frame.checkpoint()` API needs exactly this plus a verification, or it will do nothing at
 * some sizes and there will be no way to tell from the outside.
*/
async function arm(frame) {
    await frame.query('CREATE OR REPLACE TABLE _checkpoint_arm (a INTEGER)');
    await frame.query('DROP TABLE _checkpoint_arm');
}

/**
 * The answer the table must keep giving. Cheap, but touches every kind of column: a count, a
 * string aggregate, a numeric sum and a distinct - so a lost or re-encoded segment would show.
*/
async function answer(frame, table) {
    const rows = await frame.query(
        'SELECT count(*), count(DISTINCT "category"), sum("count"), sum(length("description"))'
        + ` FROM "${table}"`
    );
    return JSON.stringify(rows[0]);
}

/** Writes the corpus as `PAYLOADS` Parquet files, the way the api-server hands it over. */
async function buildPayloads(rows, count, prefix) {
    const perPayload = Math.floor(rows / count);
    const files = [];
    for (let n = 0; n < count; n++) {
        const producer = await DuckFrame.fromRecords(
            CONFIG, makeRecords(perPayload, n + 1), { name: `${prefix}_p${n}` }
        );
        const file = path.join(scratch, `${prefix}-${n}.parquet`);
        await producer.writeParquet(file);
        await producer.destroy();
        files.push(file);
    }
    return files;
}

const results = [];

async function measureScale(rows, repeat) {
    log(`\n${'-'.repeat(96)}\n${rows.toLocaleString()} rows in ${PAYLOADS} payloads`
        + `${REPEATS > 1 ? `  (repeat ${repeat}/${REPEATS})` : ''}`);

    const payloads = await buildPayloads(rows, PAYLOADS, `s${rows}r${repeat}`);
    const extra = payloads[0]; // one more payload, to dirty the table again after a checkpoint
    await closeDuckDatabase();

    const frame = await DuckFrame.create(CONFIG, { name: 'master' });
    const table = frame.table;
    if (AUTO === 'off') await frame.query("SET checkpoint_threshold = '1TB'");

    const ingest = await timed(async () => {
        for (const file of payloads) await frame.append({ parquet: file });
    });

    const beforeMB = await duckMemoryMB(frame);
    const beforeComp = await compression(frame, table);
    const expected = await answer(frame, table);

    // 1. the checkpoint itself, armed so it cannot silently decline
    const arming = await timed(() => arm(frame));
    const first = await timed(() => frame.query('CHECKPOINT'));
    let afterMB = await duckMemoryMB(frame);
    let afterComp = await compression(frame, table);

    /**
     * **A plain `CHECKPOINT` sometimes declines, silently.** Measured at 1M and 2M rows here while
     * 100k, 500k, 5M and 10M compressed: 0 ms, no error, every segment still `Uncompressed`, memory
     * unchanged. So the call is verified, and `FORCE CHECKPOINT` - documented to run whether or not
     * DuckDB thinks one is needed - is timed as the fallback. Whichever one actually compressed is
     * the cost that belongs in the curve, and `noop` records that the plain call cannot be trusted.
    */
    const noop = afterComp.uncompressed >= beforeComp.uncompressed;
    let forced = null;
    if (noop) {
        forced = await timed(() => frame.query('FORCE CHECKPOINT'));
        afterMB = await duckMemoryMB(frame);
        afterComp = await compression(frame, table);
    }

    const afterAnswer = await answer(frame, table);

    // 2. the floor: nothing is dirty, so this is what the CALL costs
    const repeatCall = await timed(() => frame.query('CHECKPOINT'));

    // 3. one more payload lands, then a re-checkpoint - incremental, or the whole table again?
    const appended = await timed(() => frame.append({ parquet: extra }));
    const dirty = await compression(frame, table);
    await arm(frame);
    const second = await timed(() => frame.query('CHECKPOINT'));
    let secondComp = await compression(frame, table);
    let secondMs = second.ms;
    // the same verification: if the plain call declined, FORCE is the cost that counts
    if (secondComp.uncompressed >= dirty.uncompressed) {
        const rescue = await timed(() => frame.query('FORCE CHECKPOINT'));
        secondMs += rescue.ms;
        secondComp = await compression(frame, table);
    }
    const secondMB = await duckMemoryMB(frame);
    const grownRows = Number((await frame.query(`SELECT count(*) FROM "${table}"`))[0][0]);

    // 4. the same rows over 3 columns instead of 30
    const narrowName = 'narrow';
    await frame.query(
        `CREATE OR REPLACE TABLE "${narrowName}" AS SELECT `
        + NARROW.map((c) => `"${c}"`).join(', ') + ` FROM "${table}"`
    );
    const narrow = await timed(() => frame.query('CHECKPOINT'));

    const actual = Number((await frame.query(`SELECT count(*) FROM "${table}"`))[0][0]);
    const effective = noop ? forced.ms : first.ms;
    log(`  ingest ${ms(ingest.ms)}  ->  arm ${ms(arming.ms)} + CHECKPOINT ${ms(first.ms)}`
        + (noop
            ? `  DID NOTHING - FORCE CHECKPOINT ${ms(forced.ms)}`
            : '')
        + `  (${(effective / (rows / 1e6)).toFixed(0)} ms/1M rows effective)`);
    log(`  memory ${beforeMB.toFixed(0)} MB -> ${afterMB.toFixed(0)} MB`
        + `  (${(beforeMB / afterMB).toFixed(1)}x)   uncompressed segments`
        + ` ${beforeComp.uncompressed} -> ${afterComp.uncompressed}`
        + `   now ${afterComp.schemes}`);
    if (beforeComp.compressed) {
        log(`  NOTE: ${beforeComp.compressed} segment(s) were ALREADY compressed before the`
            + ' checkpoint - an automatic one fired during ingest, so this cost is a mixed table');
    }
    log(`  repeat checkpoint, nothing dirty: ${ms(repeatCall.ms)}`);
    log(`  + 1 payload (${appended.value.toLocaleString()} rows, ${ms(appended.ms)},`
        + ` ${dirty.uncompressed} segments left uncompressed)`
        + ` -> re-checkpoint ${ms(secondMs)}  [${(secondMs / effective * 100).toFixed(0)}% of the`
        + ` first, for ${(100 * (rows / PAYLOADS) / rows).toFixed(0)}% more rows]`
        + `   memory ${secondMB.toFixed(0)} MB, ${grownRows.toLocaleString()} rows,`
        + ` ${secondComp.uncompressed} still uncompressed`);
    log(`  3 columns instead of 30, same rows: ${ms(narrow.ms)}`);
    log(`  answer unchanged: ${afterAnswer === expected ? 'YES' : `NO - ${expected} vs ${afterAnswer}`}`
        + `   rows ${actual.toLocaleString()}`);

    results.push({
        rows,
        repeat,
        noop,
        ingestMs: ingest.ms,
        armMs: arming.ms,
        checkpointMs: first.ms,
        forcedMs: forced ? forced.ms : null,
        effectiveMs: effective,
        perMillion: effective / (rows / 1e6),
        repeatMs: repeatCall.ms,
        secondMs,
        narrowMs: narrow.ms,
        beforeMB,
        afterMB,
        beforeComp,
        afterComp,
        ok: afterAnswer === expected,
    });

    await frame.destroy();
    await closeDuckDatabase();
    for (const file of payloads) fs.rmSync(file, { force: true });
}

for (const rows of SCALES) {
    for (let repeat = 1; repeat <= REPEATS; repeat++) {
        await measureScale(rows, repeat);
    }
}

log(`\n${'='.repeat(96)}\n`);
log('| rows | ingest | arm | CHECKPOINT | ms/1M rows | immediate repeat | re-ckpt after +5% rows |'
    + ' 3 of 30 columns | DuckDB memory before -> after |');
log('|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
    log(`| ${r.rows.toLocaleString()} | ${ms(r.ingestMs)} | ${ms(r.armMs)} |`
        + ` **${ms(r.effectiveMs)}**${r.noop ? ' (plain declined; FORCE) ' : ''} |`
        + ` ${r.perMillion.toFixed(0)} | ${ms(r.repeatMs)} | ${ms(r.secondMs)} |`
        + ` ${ms(r.narrowMs)} | ${r.beforeMB.toFixed(0)} -> ${r.afterMB.toFixed(0)} MB`
        + ` (${(r.beforeMB / r.afterMB).toFixed(1)}x) |`);
}
const noops = results.filter((r) => r.noop).length;
log(`\na plain CHECKPOINT silently did nothing in ${noops}/${results.length} runs`);
log(`\nauto-checkpointing during ingest: ${AUTO === 'off' ? 'SUPPRESSED' : 'DuckDB default (16 MiB)'}`);
log(`answers unchanged at every scale: ${results.every((r) => r.ok) ? 'YES' : 'NO'}`);
log(`node ${process.version} | ${os.cpus().length} cores`
    + ` | ${(os.totalmem() / 1024 ** 3).toFixed(0)} GB RAM`);

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(0);
