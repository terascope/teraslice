/**
 * ONE BILLION ROWS in a file-backed table, then a spread of real queries against it.
 *
 * **Generated SERVER-SIDE with `range()`, on purpose.** The JavaScript producer path
 * (`fromRecords` + `writeParquet`) runs at ~145k rows/s, so a billion rows through it is ~114
 * minutes and a previous attempt was reaped by the task harness at 244M. `range()` builds the same
 * shapes at ~8M rows/s, which puts the build in minutes - and this script is measuring what a
 * billion-row TABLE costs to hold and to query, not how fast Node can make records. The ingest path
 * itself is measured properly in `append-ingest.mjs` and `scale-ingest.mjs`.
 *
 * **Cardinality is the point of the schema.** A table of all-distinct values overstates size and
 * understates compression; a table of ten repeated values does the opposite and makes every
 * group-by trivial. The columns below span six orders of magnitude of distinctness, which is what a
 * real event table looks like:
 *
 *   id           1,000,000,000  unique
 *   session_id     100,000,000  ~10 rows each
 *   user_id         10,000,000  ~100 rows each
 *   name             1,000,000  ~1,000 rows each
 *   city                50,000
 *   category               500
 *   country                200
 *   status                   8
 *   ts          ~31,536,000 distinct seconds over one year
 *   amount, score           high-cardinality numerics
 *
 * Cleans up the database and spill directory on the way out, including on failure.
 *
 *     cd packages/data-mate && node docs/tools/bench/billion.mjs
 *     TARGET=200000000 node docs/tools/bench/billion.mjs      # a shorter rehearsal
 */
import { rm, stat } from 'node:fs/promises';
import { duckdb, heading, note } from '../lib/duck.mjs';

const TARGET = Number(process.env.TARGET || 1_000_000_000);
const BATCH = Number(process.env.BATCH || 50_000_000);
const MEM = process.env.MEM || '24GiB';
const TH = process.env.THREADS || String(navigator.hardwareConcurrency ?? 8);
const DB = process.env.DB || '/tmp/duck-billion.db';
const SPOOL = process.env.SPOOL || '/tmp/duck-billion-spool';

const num = (n) => Math.round(n).toLocaleString();
const gib = (b) => `${(b / 1024 ** 3).toFixed(2)} GiB`;
const mib = (b) => `${(b / 1024 ** 2).toFixed(0)} MiB`;

async function cleanup() {
    for (const path of [DB, `${DB}.wal`]) await rm(path, { force: true });
    await rm(SPOOL, { recursive: true, force: true });
}

async function dbBytes() {
    let total = 0;
    for (const suffix of ['', '.wal']) {
        try { total += (await stat(DB + suffix)).size; } catch { /* not there */ }
    }
    return total;
}

const { DuckDBInstance } = await duckdb();
await cleanup();

const inst = await DuckDBInstance.create(DB, { threads: TH, memory_limit: MEM });
const conn = await inst.connect();
await conn.run(`SET temp_directory = '${SPOOL}'`);
await conn.run("SET max_temp_directory_size = '400GiB'");
await conn.run('SET preserve_insertion_order = false');

const rows = async (sql) => (await (await conn.run(sql)).getRowsJson());
const ms = (mark) => Number(process.hrtime.bigint() - mark) / 1e6;

/**
 * One batch, with every column's cardinality set by a modulus of a HASH rather than of `i`.
 *
 * **The hash is what makes the size figure honest.** `i % 500` cycles 0,1,2,...,499,0,1,2 - a
 * perfectly periodic run that RLE and dictionary encoding compress far better than real data ever
 * would. Measured at 20M rows: the cyclic form stored 16.6 MiB per million, the scattered form
 * below stores substantially more, and the difference is entirely an artefact of the generator.
 * `hash()` gives the same DISTINCTNESS with realistic disorder.
 */
function batchSql(from, count) {
    const h = 'hash(i)';
    return `INSERT INTO events SELECT
        i                                                        AS id,
        ${h} % 100000000                                          AS session_id,
        hash(i * 31) % 10000000                                   AS user_id,
        'user_' || (hash(i * 17) % 1000000)                       AS name,
        'city_' || (hash(i * 7) % 50000)                          AS city,
        'cat_' || (hash(i * 13) % 500)                            AS category,
        'ISO' || lpad((hash(i * 3) % 200)::VARCHAR, 3, '0')       AS country,
        ['new','open','pending','active','paused','done','failed','archived'][((hash(i * 5) % 8) + 1)::INTEGER] AS status,
        TIMESTAMP '2025-01-01 00:00:00'
            + INTERVAL (hash(i * 11) % 31536000) SECOND           AS ts,
        (hash(i * 23) % 100000000) / 100.0                        AS amount,
        hash(i * 29) % 1001                                       AS score,
        ((hash(i * 37) % 97) = 0)                                 AS flagged
        FROM range(${from}, ${from + count}) t(i)`;
}

try {
    heading(`BILLION: ${num(TARGET)} rows, file-backed, memory_limit ${MEM}, ${TH} threads`);
    note(`database ${DB}`);

    await conn.run(`CREATE TABLE events (
        id BIGINT, session_id BIGINT, user_id BIGINT, name VARCHAR, city VARCHAR,
        category VARCHAR, country VARCHAR, status VARCHAR, ts TIMESTAMP,
        amount DOUBLE, score INTEGER, flagged BOOLEAN)`);

    const build = process.hrtime.bigint();
    let peakRss = 0;
    let done = 0;
    let checkpointMs = 0;

    while (done < TARGET) {
        const count = Math.min(BATCH, TARGET - done);
        const mark = process.hrtime.bigint();
        await conn.run(batchSql(done, count));
        const insertMs = ms(mark);

        const cpMark = process.hrtime.bigint();
        await conn.run('CHECKPOINT');
        checkpointMs += ms(cpMark);

        done += count;
        const rss = process.memoryUsage().rss;
        if (rss > peakRss) peakRss = rss;
        note(`${num(done).padStart(15)} rows | insert ${(insertMs / 1000).toFixed(1)}s`
            + ` | ${num(count / (insertMs / 1000)).padStart(11)} rows/s`
            + ` | rss ${mib(rss)} | disk ${gib(await dbBytes())}`);
    }

    const buildMs = ms(build);

    heading('BUILD');
    note(`rows            ${num((await rows('SELECT count(*) FROM events'))[0][0])}`);
    note(`build time      ${(buildMs / 1000).toFixed(1)} s`
        + ` (${num(TARGET / (buildMs / 1000))} rows/s)`);
    note(`of which CHECKPOINT ${(checkpointMs / 1000).toFixed(1)} s`);
    note(`disk            ${gib(await dbBytes())}`
        + ` (${((await dbBytes()) / 1024 ** 2 / (TARGET / 1e6)).toFixed(1)} MiB per million)`);
    note(`peak rss        ${gib(peakRss)}`);

    const storage = await rows(
        "SELECT compression, count(*) FROM pragma_storage_info('events') GROUP BY 1 ORDER BY 2 DESC"
    );
    note(`compression     ${storage.map(([k, v]) => `${k}=${v}`).join(' ')}`);

    heading('QUERIES (cold, one run each, timed)');
    const QUERIES = [
        ['count(*)', 'SELECT count(*) FROM events'],
        ['count WHERE 8-way key', "SELECT count(*) FROM events WHERE status = 'active'"],
        ['count WHERE selective', "SELECT count(*) FROM events WHERE user_id = 4242"],
        ['count WHERE range', 'SELECT count(*) FROM events WHERE score BETWEEN 900 AND 910'],
        ['count WHERE date range',
            "SELECT count(*) FROM events WHERE ts >= '2025-06-01' AND ts < '2025-07-01'"],
        ['sum + avg', 'SELECT sum(amount), avg(amount), min(amount), max(amount) FROM events'],
        ['group by status (8)',
            'SELECT status, count(*), avg(amount) FROM events GROUP BY 1 ORDER BY 2 DESC'],
        ['group by country (200)',
            'SELECT country, count(*), sum(amount) FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10'],
        ['group by category (500)',
            'SELECT category, count(*) FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10'],
        ['group by city (50k)',
            'SELECT city, count(*) FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10'],
        ['group by name (1M)',
            'SELECT name, count(*) FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10'],
        ['group by user_id (10M)',
            'SELECT user_id, count(*) FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10'],
        ['group by 2 keys + 3 aggs',
            'SELECT country, status, count(*), sum(amount), avg(score) FROM events'
            + ' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20'],
        ['count(DISTINCT status)', 'SELECT count(DISTINCT status) FROM events'],
        ['count(DISTINCT user_id) exact', 'SELECT count(DISTINCT user_id) FROM events'],
        ['approx_count_distinct user_id', 'SELECT approx_count_distinct(user_id) FROM events'],
        ['top 100 by amount', 'SELECT id, amount FROM events ORDER BY amount DESC LIMIT 100'],
        ['filter + group + order (dashboard)',
            "SELECT category, count(*) c, sum(amount) FROM events"
            + " WHERE ts >= '2025-03-01' AND ts < '2025-04-01' AND status IN ('active','open')"
            + ' GROUP BY 1 ORDER BY c DESC LIMIT 20'],
        ['month histogram',
            "SELECT date_trunc('month', ts) m, count(*) FROM events GROUP BY 1 ORDER BY 1"],
        ['median amount', 'SELECT median(amount) FROM events'],
        ['quantiles', 'SELECT quantile_cont(amount, [0.5, 0.9, 0.99]) FROM events'],
    ];

    note('query                                    ms       rows out   peak rss');
    for (const [label, sql] of QUERIES) {
        // one query must not discard a build that took ten minutes - exact quantiles over a
        // billion doubles is the one most likely to exhaust the limit and spill or fail
        const mark = process.hrtime.bigint();
        try {
            const out = await rows(sql);
            const took = ms(mark);
            const rss = process.memoryUsage().rss;
            if (rss > peakRss) peakRss = rss;
            note(`${label.padEnd(37)}${took.toFixed(0).padStart(8)}`
                + `${num(out.length).padStart(13)}   ${mib(rss)}`);
        } catch (err) {
            note(`${label.padEnd(37)}${ms(mark).toFixed(0).padStart(8)}   FAILED: `
                + String(err.message).split('\n')[0].slice(0, 52));
        }
    }

    heading('STREAMING the whole table out');
    const streamMark = process.hrtime.bigint();
    let streamed = 0;
    let streamPeak = 0;
    const reader = await conn.stream('SELECT id, user_id, amount FROM events');
    for (;;) {
        const chunk = await reader.fetchChunk();
        if (!chunk || chunk.rowCount === 0) break;
        streamed += chunk.rowCount;
        const rss = process.memoryUsage().rss;
        if (rss > streamPeak) streamPeak = rss;
    }
    const streamMs = ms(streamMark);
    note(`${num(streamed)} rows in ${(streamMs / 1000).toFixed(1)} s`
        + ` = ${num(streamed / (streamMs / 1000))} rows/s, peak rss ${gib(streamPeak)}`);

    heading('FINAL');
    note(`disk       ${gib(await dbBytes())}`);
    note(`peak rss   ${gib(peakRss)}`);
} finally {
    heading('CLEANUP');
    const before = await dbBytes();
    await cleanup();
    note(`removed ${gib(before)} - ${DB} and ${SPOOL} deleted`);
}

process.exit(0);
