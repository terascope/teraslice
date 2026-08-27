/**
 * WHY does a `CHECKPOINT` sometimes return in 0 ms and compress NOTHING?
 *
 * `checkpoint-cost.mjs` measured the cost curve and found two of six scales where the call did
 * nothing at all - 1M and 2M rows returned instantly with every segment still `Uncompressed` and
 * memory unchanged - while 100k, 500k, 5M and 10M compressed 3.7-5.8x. No error either way. That
 * is unusable as a policy: an API that silently declines to do the thing is worse than no API.
 *
 * A cost number measured through a call that sometimes does nothing is not a cost number, so this
 * has to be understood before the curve can be quoted (correction §0.7: verify HOW you measure).
 *
 * Two hypotheses, and the probe separates them:
 *
 *  1. **A connection-per-write hypothesis.** `DuckFrame.append` takes its OWN connection per
 *     payload, for transaction-isolation reasons. If a just-disconnected connection's transaction
 *     is still visible to the storage manager, DuckDB has rows it cannot compress and skips.
 *  2. **A "checkpoint not needed" flag hypothesis.** DuckDB checkpoints automatically, and after
 *     one, a manual `CHECKPOINT` may see a clear flag and return immediately even though row
 *     groups appended since are still uncompressed. `FORCE CHECKPOINT` is documented to run
 *     regardless.
 *
 * So: 20 batches inserted three ways - all on ONE connection, on a NEW connection per batch (what
 * `append` does), and **from PARQUET on a new connection per batch** (what the worker really does) -
 * then either `CHECKPOINT` or `FORCE CHECKPOINT`, at three sizes, twice each; and after every call,
 * whether the segments actually changed. Raw SQL against the binding throughout, no `DuckFrame`, so
 * nothing of ours can be the cause. Parquet is a separate source because it is the one thing the
 * failing runs had that a plain `INSERT ... SELECT` does not.
 *
 *     node packages/data-mate/docs/tools/probe/checkpoint-noop.mjs
 *     SIZES=1000000,2000000 REPEATS=3 node .../checkpoint-noop.mjs
*/
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { open } from '../lib/duck.mjs';

const SIZES = (process.env.SIZES || '500000,1000000,2000000')
    .split(',').map((s) => Number(s.trim()));
const REPEATS = Number(process.env.REPEATS || 2);
const BATCHES = Number(process.env.BATCHES || 20);

const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

/**
 * Five columns chosen so compression has something to bite on: two low-cardinality strings that
 * should become `DICT_FSST`, a constant, a bit-packable integer and a wide-range one.
*/
const INSERT = (n, offset) => `
    INSERT INTO t SELECT
        'cat-' || (i % 5)                        AS category,
        'status-' || (i % 3)                     AS status,
        'constant'                               AS fixed,
        (i % 1000)::INTEGER                      AS small,
        (${offset} + i)::BIGINT                  AS big
    FROM range(${n}) AS r(i)`;

async function rows(connection, sql) {
    return (await (await connection.run(sql)).getRowsJson());
}

/** The dominant compression schemes, so "did anything happen" is a fact and not an inference. */
async function state(connection) {
    const comp = await rows(
        connection,
        `SELECT compression, count(*) FROM pragma_storage_info('t')
         GROUP BY 1 ORDER BY 2 DESC`
    );
    const memory = await rows(connection, 'SELECT sum(memory_usage_bytes) FROM duckdb_memory()');
    return {
        uncompressed: Number(comp.find(([scheme]) => scheme === 'Uncompressed')?.[1] ?? 0),
        total: comp.reduce((sum, [, count]) => sum + Number(count), 0),
        schemes: comp.map(([scheme, count]) => `${scheme}:${count}`).join(' '),
        memoryMB: Number(memory[0][0] ?? 0) / 1024 ** 2,
    };
}

const results = [];

/**
 * How the 20 batches get in. `parquet` is the worker's real path: a payload file per fetch, read
 * with `INSERT ... BY NAME SELECT * FROM read_parquet`, each on its own connection.
*/
const SOURCES = ['one-conn', 'conn-per-batch', 'parquet'];

async function trial({
    size, source, mode, repeat, payload
}) {
    const db = await open(':memory:');
    const { instance, connection } = db;

    await connection.run(
        'CREATE TABLE t (category VARCHAR, status VARCHAR, fixed VARCHAR,'
        + ' small INTEGER, big BIGINT)'
    );

    const each = Math.floor(size / BATCHES);
    for (let n = 0; n < BATCHES; n++) {
        if (source === 'one-conn') {
            await connection.run(INSERT(each, n * each));
            continue;
        }

        // exactly what `DuckFrame.append` does: its own connection, its own transaction
        const own = await instance.connect();
        try {
            await own.run('BEGIN TRANSACTION');
            await own.run(source === 'parquet'
                ? `INSERT INTO t BY NAME SELECT * REPLACE (big + ${n * each} AS big)`
                    + ` FROM read_parquet('${payload}')`
                : INSERT(each, n * each));
            await own.run('COMMIT');
        } finally {
            own.disconnectSync();
        }
    }

    const before = await state(connection);

    const start = performance.now();
    await connection.run(mode);
    const ms = performance.now() - start;
    const after = await state(connection);

    // if the requested mode did nothing, does FORCE fix it? That is the whole API question
    let rescue = null;
    if (after.uncompressed === before.uncompressed && before.uncompressed > 0) {
        const t = performance.now();
        await connection.run('FORCE CHECKPOINT');
        const rescued = await state(connection);
        rescue = { ms: performance.now() - t, uncompressed: rescued.uncompressed };
    }

    const worked = after.uncompressed < before.uncompressed;
    results.push({
        size, source, mode, repeat, ms, worked, before, after, rescue
    });

    log(`  ${`${(size / 1000)}k`.padEnd(7)}${source.padEnd(16)}`
        + `${mode.padEnd(17)}${`${ms.toFixed(0)} ms`.padStart(9)}`
        + `   ${worked ? 'COMPRESSED' : 'NO-OP     '}`
        + `   uncompressed ${before.uncompressed} -> ${after.uncompressed}`
        + `   mem ${before.memoryMB.toFixed(0)} -> ${after.memoryMB.toFixed(0)} MB`
        + (rescue
            ? `   | FORCE after it: ${rescue.ms.toFixed(0)} ms, uncompressed -> ${rescue.uncompressed}`
            : ''));

    db.close();
}

const db = await open(':memory:');
const settings = await rows(
    db.connection,
    "SELECT name, value FROM duckdb_settings() WHERE name ILIKE '%checkpoint%'"
);
log('\ncheckpoint-related settings on a fresh in-memory database:');
for (const [name, value] of settings) log(`  ${name} = ${value}`);
const version = await rows(db.connection, 'SELECT version()');
log(`  duckdb ${version[0][0]}`);
db.close();

log(`\n${BATCHES} batches per table, ${REPEATS} repeat(s) per configuration\n`);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-ckptnoop-'));

for (const size of SIZES) {
    // one payload file per size, written once and read 20 times - the shape of 20 fetches
    const payload = path.join(scratch, `payload-${size}.parquet`);
    const writer = await open(':memory:');
    await writer.connection.run(
        `COPY (${INSERT(Math.floor(size / BATCHES), 0).split('INSERT INTO t ')[1]})`
        + ` TO '${payload}' (FORMAT parquet)`
    );
    writer.close();

    for (const source of SOURCES) {
        for (const mode of ['CHECKPOINT', 'FORCE CHECKPOINT']) {
            for (let repeat = 1; repeat <= REPEATS; repeat++) {
                await trial({
                    size, source, mode, repeat, payload
                });
            }
        }
    }
    log('');
}

log('='.repeat(100));
const summarise = (filter, title) => {
    const subset = results.filter(filter);
    if (!subset.length) return;
    const worked = subset.filter((r) => r.worked).length;
    log(`  ${title.padEnd(46)}compressed in ${worked}/${subset.length} trials`);
};
for (const mode of ['CHECKPOINT', 'FORCE CHECKPOINT']) {
    for (const source of SOURCES) {
        summarise((r) => r.mode === mode && r.source === source, `${mode}, ${source}`);
    }
}
const rescued = results.filter((r) => r.rescue);
if (rescued.length) {
    const fixed = rescued.filter((r) => r.rescue.uncompressed === 0).length;
    log(`\n  a FORCE CHECKPOINT issued after a no-op fixed it in ${fixed}/${rescued.length} cases`);
}

fs.rmSync(scratch, { recursive: true, force: true });

process.exit(0);
