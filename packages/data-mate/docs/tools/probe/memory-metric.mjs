/**
 * WHAT DOES `duckdb_memory()` ACTUALLY MEASURE? — a probe, because the report leaned on it.
 *
 * The report claims a Parquet view holds ~65x less memory than a native table. That rests on
 * `SELECT sum(memory_usage_bytes) FROM duckdb_memory()`, and the native figures came out equal to
 * the database FILE SIZE to four decimal places at every scale from 100k to 100M. A metric that
 * tracks file size is not measuring resident memory, so the claim has to be checked before it is
 * repeated.
 *
 * **The decisive test:** set `memory_limit` far BELOW the database size. Resident memory cannot
 * exceed the limit. If the metric still reports ~the file size, it is counting blocks the buffer
 * manager knows about, not bytes it is holding - and the comparison in the report is an artifact.
 *
 * Each case runs in its OWN PROCESS (`MODE=<case>`), because process RSS accumulates across phases
 * and cannot otherwise be attributed. The driver spawns them and prints the comparison.
 *
 * Run:  node packages/data-mate/docs/tools/probe/memory-metric.mjs
 */
import { rm, stat, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { duckdb, duckFrame, heading, note } from '../lib/duck.mjs';

const run = promisify(execFile);
const ROWS = Number(process.env.ROWS || 10_000_000);
const ROOT = process.env.ROOT || '/tmp/duck-memprobe';
const DB = join(ROOT, 'native.db');
const PQ = join(ROOT, 'corpus.parquet');
const MODE = process.env.MODE || null;

const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;

/**
 * The SAME 15-query battery the report measured, run 3x - matching the ladder exactly. The first
 * version of this probe used five light queries, never populated the buffer manager, and therefore
 * disagreed with the ladder for a reason that had nothing to do with the metric.
 */
const QUERIES = [
    'SELECT count(*) FROM t',
    `SELECT count(*) FROM t WHERE "active" = true AND "category" = 'gamma'`,
    `SELECT count(*) FROM t WHERE "amount" BETWEEN 100 AND 5000 AND "status" = 'active'`,
    `SELECT count(*) FROM t WHERE "email" LIKE 'user1%'`,
    `SELECT count(*) FROM t WHERE "category" IN ('alpha','gamma')`,
    'SELECT * FROM t WHERE "active" = true ORDER BY "amount" DESC LIMIT 100',
    'SELECT "category", count(*), sum("amount"), avg("score") FROM t GROUP BY 1',
    'SELECT "category", "status", count(*), sum("amount"), max("score") FROM t GROUP BY 1, 2',
    'SELECT "name", count(*) FROM t GROUP BY 1',
    `SELECT "category", sum("amount") AS total FROM t WHERE "active" = true GROUP BY 1 ORDER BY total DESC LIMIT 20`,
    'SELECT count(DISTINCT "name") FROM t',
    'SELECT approx_count_distinct("name") FROM t',
    'SELECT quantile_cont("amount", [0.5, 0.9, 0.99]) FROM t',
    'SELECT sum("amount") FROM t',
    'SELECT * FROM t LIMIT 5000',
];
const PASSES = 3;

async function memoryBreakdown(connection) {
    const rows = await (await connection.run(
        `SELECT tag, memory_usage_bytes::BIGINT, temporary_storage_bytes::BIGINT
         FROM duckdb_memory() WHERE memory_usage_bytes > 0 OR temporary_storage_bytes > 0
         ORDER BY memory_usage_bytes DESC`
    )).getRowsJson();
    return rows.map((r) => ({ tag: String(r[0]), bytes: Number(r[1]), temp: Number(r[2]) }));
}

/* ------------------------------------------------------- one case, own process */

if (MODE) {
    const [kind, limit] = MODE.split(':');
    const { DuckDBInstance } = await duckdb();
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${limit}'`);

    const applied = (await (await connection.run(
        "SELECT current_setting('memory_limit')"
    )).getRowsJson())[0][0];

    let failure = null;
    try {
        if (kind === 'native') {
            await connection.run(`ATTACH '${DB}' AS nat (READ_ONLY)`);
            // DuckFrame.create uniquifies the table name, so ask the catalogue rather than assume
            const tbl = (await (await connection.run(
                "SELECT table_name FROM duckdb_tables() WHERE database_name = 'nat' LIMIT 1"
            )).getRowsJson())[0][0];
            await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM nat."${tbl}"`);
        } else {
            await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${PQ}')`);
        }
        for (let i = 0; i < PASSES; i++) {
            for (const q of QUERIES) await (await connection.run(q)).getRowsJson();
        }
    } catch (err) {
        failure = String(err.message || err).split('\n')[0];
    }

    const breakdown = failure ? [] : await memoryBreakdown(connection);
    const total = breakdown.reduce((a, b) => a + b.bytes, 0);
    const temp = breakdown.reduce((a, b) => a + b.temp, 0);
    // rusage maxrss is the process PEAK, which is the only honest resident figure available
    const peakRss = process.resourceUsage().maxRSS * 1024;

    console.log(JSON.stringify({
        mode: MODE, applied, failure, total, temp, peakRss, breakdown,
    }));
    connection.disconnectSync();
    instance.closeSync();
    process.exit(0);
}

/* ------------------------------------------------------- driver */

heading(`WHAT duckdb_memory() MEASURES — ${ROWS.toLocaleString()} rows`);

await mkdir(ROOT, { recursive: true });
if (!existsSync(DB) || !existsSync(PQ)) {
    const { DuckFrame, closeDuckDatabase } = await duckFrame();
    const { CONFIG, makeRecords } = await import(
        new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
    );
    for (const p of [DB, `${DB}.wal`, PQ]) if (existsSync(p)) await rm(p, { force: true });
    const frame = await DuckFrame.create(CONFIG, { name: 'corpus', database: DB });
    let built = 0;
    while (built < ROWS) {
        const take = Math.min(100_000, ROWS - built);
        await frame.append({ records: makeRecords(take, built + 1) });
        built += take;
    }
    await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
    await frame.query('DROP TABLE _arm');
    await frame.query('CHECKPOINT');
    await frame.query(`COPY "${frame.table}" TO '${PQ}' (FORMAT parquet, COMPRESSION zstd)`);
    await closeDuckDatabase(DB);
    note('corpus built');
}

const dbBytes = (await stat(DB)).size;
const pqBytes = (await stat(PQ)).size;
note(`native db ${mb(dbBytes)} · parquet ${mb(pqBytes)}`);

const self = fileURLToPath(import.meta.url);
const CASES = (process.env.CASES || 'native:24GiB,native:2GiB,native:512MiB,native:256MiB,'
    + 'parquet:24GiB,parquet:512MiB,parquet:256MiB').split(',');

const out = [];
for (const mode of CASES) {
    const { stdout } = await run(process.execPath, [self], {
        env: { ...process.env, MODE: mode, ROOT },
        maxBuffer: 1 << 24,
    });
    out.push(JSON.parse(stdout.trim().split('\n').at(-1)));
}

heading('RESULT — reported "memory" against the limit it was supposedly bounded by');
note(`  ${'case'.padEnd(20)}${'limit applied'.padStart(15)}${'duckdb_memory()'.padStart(17)}`
    + `${'> limit?'.padStart(10)}${'peak RSS'.padStart(12)}${'spilled'.padStart(11)}`);
for (const r of out) {
    const limitBytes = /GiB/.test(r.applied)
        ? parseFloat(r.applied) * 1024 ** 3
        : parseFloat(r.applied) * 1024 ** 2;
    note(`  ${r.mode.padEnd(20)}${r.applied.padStart(15)}`
        + `${(r.failure ? 'FAILED' : mb(r.total)).padStart(17)}`
        + `${(r.failure ? '—' : (r.total > limitBytes ? 'YES' : 'no')).padStart(10)}`
        + `${mb(r.peakRss).padStart(12)}${(r.failure ? '—' : mb(r.temp)).padStart(11)}`);
    if (r.failure) note(`      ${r.failure}`);
}

heading('WHERE THE BYTES ARE ATTRIBUTED — by tag');
for (const r of out) {
    if (r.failure) continue;
    note(`  ${r.mode}`);
    for (const b of r.breakdown) {
        note(`      ${b.tag.padEnd(24)}${mb(b.bytes).padStart(12)}`
            + (b.temp ? `  (+${mb(b.temp)} temp)` : ''));
    }
}

heading('VERDICT');
const nat24 = out.find((r) => r.mode === 'native:24GiB');
const nat512 = out.find((r) => r.mode === 'native:512MiB');
if (nat24 && nat512 && !nat512.failure) {
    const stable = Math.abs(nat24.total - nat512.total) / nat24.total < 0.05;
    note(stable
        ? `  duckdb_memory() reports ${mb(nat512.total)} under a 512 MiB limit - it CANNOT be`
          + ' resident memory. The metric tracks blocks the buffer manager knows about, i.e. the'
          + ' database size, NOT bytes held. Do not compare it across storage kinds.'
        : `  the figure MOVED with the limit (${mb(nat24.total)} -> ${mb(nat512.total)}), so it does`
          + ' track something bounded by the limit. Compare peak RSS to confirm.');
}
note('  peak RSS is the figure to trust for "will this fit in the worker".');

const OUT = process.env.OUT || new URL('../results/memory.json', import.meta.url).pathname;
await writeFile(OUT, JSON.stringify({
    rows: ROWS,
    nativeBytes: dbBytes,
    parquetBytes: pqBytes,
    cases: out.map((r) => ({
        mode: r.mode,
        kind: r.mode.split(':')[0],
        limit: r.applied,
        duckMemBytes: r.failure ? null : r.total,
        peakRssBytes: r.peakRss,
        failure: r.failure,
        breakdown: r.breakdown,
    })),
}, null, 2));
note(`  results -> ${OUT}`);

process.exit(0);
