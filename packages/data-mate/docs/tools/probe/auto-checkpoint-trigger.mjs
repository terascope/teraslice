/**
 * WHEN does DuckDB's automatic checkpoint fire during ingest, and why at some shapes and not others?
 *
 * Measured (`bench/checkpoint-cost.mjs`, `probe/checkpoint-fragmentation.mjs`), 30-column corpus,
 * 20 Parquet payloads, and reproducible across repeats and fresh processes:
 *
 * | total rows | rows/payload | an automatic checkpoint fired during ingest |
 * |---|---|---|
 * | 100k | 5,000 | no |
 * | **500k** | **25,000** | **YES - 241 segments arrived compressed** |
 * | **500k** (40 payloads) | **12,500** | **YES - 471 segments** |
 * | 1M | 50,000 | no |
 * | 2M | 100,000 | no |
 * | 2M (40 payloads) | 50,000 | no |
 * | 5M | 250,000 | no |
 * | 10M | 500,000 | no |
 *
 * That is not monotonic in payload size OR in total rows, so no simple "over the threshold" story
 * explains it, and a guess is not good enough: it inflates ingest by up to 2.5x when it fires, and it
 * leaves the table half-compressed so the final `CHECKPOINT` pays to finish a mixed table.
 *
 * So instead of theorising, this reports the state after EVERY append - segments, how many are already
 * compressed, memory, and the append's own duration - which shows exactly WHICH append triggers it.
 * `checkpoint_threshold` is swept as well, so "the 16 MiB threshold governs this" becomes a testable
 * claim rather than an assumption.
 *
 *     node packages/data-mate/docs/tools/probe/auto-checkpoint-trigger.mjs
 *     ROWS=500000 PAYLOADS=20 THRESHOLDS=default node .../auto-checkpoint-trigger.mjs
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

/** The shapes that disagree, as `rows:payloads`. */
const SHAPES = (process.env.SHAPES || '500000:20,1000000:20,2000000:20')
    .split(',').map((pair) => pair.split(':').map(Number));
/** `default` leaves DuckDB's 16 MiB alone; anything else is passed to `SET checkpoint_threshold`. */
const THRESHOLDS = (process.env.THRESHOLDS || 'default').split(',').map((s) => s.trim());

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-trigger-'));
const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

async function state(frame, table) {
    const rows = await frame.query(
        `SELECT compression, count(*) FROM pragma_storage_info('${table}') GROUP BY 1`
    );
    const segments = rows.reduce((sum, [, count]) => sum + Number(count), 0);
    const uncompressed = Number(rows.find(([scheme]) => scheme === 'Uncompressed')?.[1] ?? 0);
    const size = await frame.query('SELECT * FROM pragma_database_size()');
    const memory = Number(
        (await frame.query('SELECT sum(memory_usage_bytes) FROM duckdb_memory()'))[0][0] ?? 0
    );
    return {
        segments,
        compressed: segments - uncompressed,
        memoryMB: memory / 1024 ** 2,
        walSize: String(size[0]?.[6] ?? '-'),
        blocks: String(size[0]?.[3] ?? '-'),
    };
}

for (const [rows, payloadCount] of SHAPES) {
    const perPayload = Math.floor(rows / payloadCount);

    const files = [];
    for (let n = 0; n < payloadCount; n++) {
        const producer = await DuckFrame.fromRecords(
            CONFIG, makeRecords(perPayload, n + 1), { name: `p${n}` }
        );
        const file = path.join(scratch, `r${rows}-${n}.parquet`);
        await producer.writeParquet(file);
        await producer.destroy();
        files.push(file);
    }
    await closeDuckDatabase();

    const bytesPerPayload = files.reduce((sum, f) => sum + fs.statSync(f).size, 0) / files.length;

    for (const threshold of THRESHOLDS) {
        log(`\n${'-'.repeat(112)}`);
        log(`${rows.toLocaleString()} rows in ${payloadCount} payloads of`
            + ` ${perPayload.toLocaleString()} rows`
            + ` (${(bytesPerPayload / 1024 ** 2).toFixed(1)} MB of Parquet each)`
            + `   checkpoint_threshold = ${threshold}`);

        const frame = await DuckFrame.create(CONFIG, { name: 'master' });
        const table = frame.table;
        if (threshold !== 'default') {
            await frame.query(`SET checkpoint_threshold = '${threshold}'`);
        }

        let previousCompressed = 0;
        for (const [n, file] of files.entries()) {
            const start = performance.now();
            await frame.append({ parquet: file });
            const ms = performance.now() - start;
            const now = await state(frame, table);

            // only print the appends that MOVED something, plus the first and last
            const fired = now.compressed > previousCompressed;
            if (fired || n === 0 || n === files.length - 1) {
                log(`  append ${String(n + 1).padStart(3)}  ${`${ms.toFixed(0)} ms`.padStart(8)}`
                    + `   segments ${String(now.segments).padStart(6)}`
                    + `   compressed ${String(now.compressed).padStart(6)}`
                    + `   memory ${now.memoryMB.toFixed(0).padStart(5)} MB`
                    + `   blocks ${now.blocks.padStart(5)}`
                    + `${fired ? '   <-- COMPRESSION APPEARED' : ''}`);
            }
            previousCompressed = now.compressed;
        }

        const final = await state(frame, table);
        log(`  end: ${final.segments} segments, ${final.compressed} compressed,`
            + ` ${final.memoryMB.toFixed(0)} MB`);

        await frame.destroy();
        await closeDuckDatabase();
    }

    for (const file of files) fs.rmSync(file, { force: true });
}

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(0);
