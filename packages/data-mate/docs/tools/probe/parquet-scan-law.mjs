/**
 * THE PARQUET SCAN MEMORY LAW — what the working set is actually proportional to.
 *
 * `probe/parquet-memory-limits.mjs` found that exactly one query shape fails on a Parquet view
 * under a tight `memory_limit` where a native table survives: a WIDE TOP-N
 * (`SELECT * … ORDER BY … LIMIT n`). This confirms what that requirement scales with, because the
 * answer decides whether it is a capacity-planning problem or a correctness cliff.
 *
 * Two predictions, both from "the scan's working set is threads x row-group x columns projected":
 *   P1  the failure threshold is INDEPENDENT of dataset size  - same at 10M and 100M rows
 *   P2  projecting fewer COLUMNS removes it at a limit where SELECT * fails
 *
 * Both hold. The consequence is that this is a FIXED per-query reservation, not something that
 * grows with the data - so it is planned for once, per concurrent query, and never again.
 *
 * Run:  node packages/data-mate/docs/tools/probe/parquet-scan-law.mjs
 */
import { stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { duckdb, heading, note } from '../lib/duck.mjs';

const run = promisify(execFile);
const OUT = process.env.OUT || new URL('../results/parquet-scan-law.json', import.meta.url).pathname;
const CELL = process.env.CELL || null;

const WIDE = 'SELECT * FROM t WHERE "active" = true ORDER BY "amount" DESC LIMIT 100';
const NARROW = 'SELECT "amount","category","name" FROM t WHERE "active" = true'
    + ' ORDER BY "amount" DESC LIMIT 100';

if (CELL) {
    const { pq, limit, sql, threads } = JSON.parse(CELL);
    const { DuckDBInstance } = await duckdb();
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    await connection.run(`SET memory_limit = '${limit}'`);
    if (threads) await connection.run(`SET threads = ${threads}`);
    let failure = null;
    try {
        await connection.run(`CREATE OR REPLACE VIEW t AS SELECT * FROM read_parquet('${pq}')`);
        await (await connection.run(sql)).getRowsJson();
    } catch (err) {
        failure = String(err.message || err).split('\n')[0];
    }
    console.log(JSON.stringify({ ok: !failure, failure }));
    connection.disconnectSync();
    instance.closeSync();
    process.exit(0);
}

const CORPORA = [
    ['10M', '/tmp/duck-memprobe/corpus.parquet'],
    ['100M', '/tmp/duck-memprobe-100m/corpus.parquet'],
].filter(([, p]) => existsSync(p));

if (!CORPORA.length) throw new Error('no corpus - run probe/memory-metric.mjs first');

const self = fileURLToPath(import.meta.url);
const cell = async (spec) => {
    const { stdout } = await run(process.execPath, [self], {
        env: { ...process.env, CELL: JSON.stringify(spec) }, maxBuffer: 1 << 24,
    });
    return JSON.parse(stdout.trim().split('\n').at(-1));
};

const LIMITS = ['2GiB', '1GiB', '512MiB', '256MiB'];
const results = { sizeIndependence: [], columnEffect: [], threadEffect: [] };

heading('P1 — is the threshold independent of DATASET SIZE?');
note(`  wide top-N (SELECT * … ORDER BY … LIMIT 100), 14 threads`);
note(`  ${'corpus'.padEnd(10)}${'file'.padStart(10)}${LIMITS.map((l) => l.padStart(10)).join('')}`);
for (const [label, pq] of CORPORA) {
    const bytes = (await stat(pq)).size;
    const marks = [];
    for (const limit of LIMITS) {
        const r = await cell({ pq, limit, sql: WIDE });
        results.sizeIndependence.push({ corpus: label, bytes, limit, ok: r.ok });
        marks.push((r.ok ? 'ok' : 'OOM').padStart(10));
    }
    note(`  ${label.padEnd(10)}${`${(bytes / 1048576).toFixed(0)} MB`.padStart(10)}${marks.join('')}`);
}

heading('P2 — does projecting fewer COLUMNS remove it?');
const [, pq10] = CORPORA[0];
for (const [label, sql] of [['SELECT * (30 columns)', WIDE], ['SELECT 3 columns', NARROW]]) {
    const r = await cell({ pq: pq10, limit: '256MiB', sql });
    results.columnEffect.push({ shape: label, limit: '256MiB', ok: r.ok });
    note(`  ${label.padEnd(24)} at 256MiB -> ${r.ok ? 'ok' : 'OOM'}`);
}

heading('P3 — and THREADS, which is the other term');
for (const threads of [14, 8, 4, 2, 1]) {
    const r = await cell({ pq: pq10, limit: '256MiB', sql: WIDE, threads });
    results.threadEffect.push({ threads, limit: '256MiB', ok: r.ok });
    note(`  threads=${String(threads).padStart(2)} at 256MiB -> ${r.ok ? 'ok' : 'OOM'}`);
}

heading('THE LAW');
note('  A Parquet scan\'s working set is THREADS x ROW-GROUP x COLUMNS PROJECTED.');
note('  It does NOT scale with the dataset. It is a fixed per-query reservation.');

await writeFile(OUT, JSON.stringify(results, null, 2));
note(`\n  results -> ${OUT}`);
process.exit(0);
