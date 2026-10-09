/**
 * How a `Date` column should be STORED, so that a `[millis, offset]` DateTuple can live in it.
 *
 * `DataFrame` holds epoch millis, or a `[millis, offset]` tuple when `setTimezone`/`toTimeZone`/
 * `toTimeZoneUsingLocation` made one, and checks which per value at run time. A DuckDB column has
 * ONE type, so a per-row "is this a tuple?" test needs a shape every row shares. Four candidates:
 *
 *   A  TIMESTAMP                          today; cannot hold an offset at all
 *   B  BIGINT epoch millis                DataFrame's own number; cannot hold an offset either
 *   C  STRUCT(ts TIMESTAMP, tz_offset)    offset NULL unless set
 *   D  BIGINT millis * 4096 + code        packed: code 0 = no offset, else offset + 2048 (12 bits;
 *                                         offsets are within +-24h). Still one integer, so min/max
 *                                         statistics, sorting and range filters keep working
 *   E  STRUCT(ms BIGINT, tz_offset)       DataFrame's own pair - two numbers - as a struct
 *
 * C and D are also written WITH offsets (C+, D+) to price the "is a tuple" branch.
 *
 * Measured over Parquet+zstd, the way the worker reads payloads, warm, median of RUNS:
 *   write     COPY to Parquet (ingest-side cost) and the file size
 *   range1    count(*) over a 1% time range - row-group pruning
 *   range50   count(*) over a 50% time range - the scan itself
 *   hours     hour-of-day histogram - a date emission with the per-row branch
 *   days      group by day
 *   topN      ORDER BY d DESC LIMIT 100
 *   iso       render every value as DataFrame's toISO8601 - the output path
 *
 * Run:  node packages/data-mate/docs/tools/bench/date-shape.mjs
 *       ROWS=1000000 RUNS=3 node .../date-shape.mjs
 */
/* eslint-disable no-console -- a bench: its result IS the console output */
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { open } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS ?? 10_000_000);
const RUNS = Number(process.env.RUNS ?? 5);

const BASE_MS = 1672531200000; // 2023-01-01T00:00:00Z
const SPAN_MS = 2 * 365 * 24 * 3600 * 1000; // two years, in arrival order with jitter
const ISO_Z = '\'%Y-%m-%dT%H:%M:%S.%gZ\'';
const ISO_LOCAL = '\'%Y-%m-%dT%H:%M:%S.%g\'';

/** New York's offset, by month - enough to give real per-row variation. */
const NY_OFFSET = 'CASE WHEN month(epoch_ms(ms)) BETWEEN 4 AND 10 THEN -240 ELSE -300 END';

/** `±HH:MM` for an offset in minutes, as `toISO8601` writes it. */
function zone(offset) {
    const pad = (part) => `lpad(CAST(${part} AS VARCHAR), 2, '0')`;
    return `(CASE WHEN ${offset} < 0 THEN '-' ELSE '+' END || ${pad(`abs(${offset}) // 60`)}`
        + ` || ':' || ${pad(`abs(${offset}) % 60`)})`;
}

const SHAPES_ALL = {
    A: {
        write: 'epoch_ms(ms)',
        instant: (d) => d,
        range: (d, lo, hi) => `${d} BETWEEN epoch_ms(${lo}::BIGINT) AND epoch_ms(${hi}::BIGINT)`,
        hours: (d) => `hour(${d})`,
        iso: (d) => `strftime(${d}, ${ISO_Z})`,
    },
    B: {
        write: 'ms',
        instant: (d) => `epoch_ms(${d})`,
        range: (d, lo, hi) => `${d} BETWEEN ${lo} AND ${hi}`,
        hours: (d) => `hour(epoch_ms(${d}))`,
        iso: (d) => `strftime(epoch_ms(${d}), ${ISO_Z})`,
    },
    C: {
        write: '{\'ts\': epoch_ms(ms), \'tz_offset\': NULL::SMALLINT}',
        instant: (d) => `${d}.ts`,
        range: (d, lo, hi) => `${d}.ts BETWEEN epoch_ms(${lo}::BIGINT) AND epoch_ms(${hi}::BIGINT)`,
        hours: (d) => `CASE WHEN ${d}.tz_offset IS NULL THEN hour(${d}.ts)`
            + ` ELSE hour(${d}.ts + to_minutes(${d}.tz_offset)) END`,
        iso: (d) => `CASE WHEN coalesce(${d}.tz_offset, 0) = 0 THEN strftime(${d}.ts, ${ISO_Z})`
            + ` ELSE strftime(${d}.ts + to_minutes(${d}.tz_offset), ${ISO_LOCAL})`
            + ` || ${zone(`${d}.tz_offset`)} END`,
    },
    E: {
        write: '{\'ms\': ms, \'tz_offset\': NULL::SMALLINT}',
        instant: (d) => `epoch_ms(${d}.ms)`,
        range: (d, lo, hi) => `${d}.ms BETWEEN ${lo} AND ${hi}`,
        hours: (d) => `CASE WHEN ${d}.tz_offset IS NULL THEN hour(epoch_ms(${d}.ms))`
            + ` ELSE hour(epoch_ms(${d}.ms + ${d}.tz_offset * 60000)) END`,
        iso: (d) => `CASE WHEN coalesce(${d}.tz_offset, 0) = 0 THEN strftime(epoch_ms(${d}.ms), ${ISO_Z})`
            + ` ELSE strftime(epoch_ms(${d}.ms + ${d}.tz_offset * 60000), ${ISO_LOCAL})`
            + ` || ${zone(`${d}.tz_offset`)} END`,
    },
    D: {
        write: 'ms * 4096',
        instant: (d) => `epoch_ms(${d} >> 12)`,
        range: (d, lo, hi) => `${d} BETWEEN ${lo}::BIGINT * 4096 AND ${hi}::BIGINT * 4096 + 4095`,
        hours: (d) => `CASE WHEN (${d} & 4095) = 0 THEN hour(epoch_ms(${d} >> 12))`
            + ` ELSE hour(epoch_ms((${d} >> 12) + ((${d} & 4095) - 2048) * 60000)) END`,
        iso: (d) => `CASE WHEN (${d} & 4095) IN (0, 2048) THEN strftime(epoch_ms(${d} >> 12), ${ISO_Z})`
            + ` ELSE strftime(epoch_ms((${d} >> 12) + ((${d} & 4095) - 2048) * 60000), ${ISO_LOCAL})`
            + ` || ${zone(`((${d} & 4095) - 2048)`)} END`,
    },
};

/** The same shapes WITH an offset on every row. */
const WITH_OFFSETS = {
    'C+': { ...SHAPES_ALL.C, write: `{'ts': epoch_ms(ms), 'tz_offset': (${NY_OFFSET})::SMALLINT}` },
    'D+': { ...SHAPES_ALL.D, write: `ms * 4096 + (${NY_OFFSET}) + 2048` },
    'E+': { ...SHAPES_ALL.E, write: `{'ms': ms, 'tz_offset': (${NY_OFFSET})::SMALLINT}` },
};

/** `SHAPES=A,B,E,E+` runs a subset. */
const PICK = process.env.SHAPES?.split(',');
const ALL = Object.fromEntries(Object.entries({ ...SHAPES_ALL, ...WITH_OFFSETS })
    .filter(([name]) => PICK == null || PICK.includes(name)));

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

async function timed(run) {
    const start = process.hrtime.bigint();
    const result = await run();
    return { ms: Number(process.hrtime.bigint() - start) / 1e6, result };
}

const dir = await mkdtemp(join(tmpdir(), 'date-shape-'));
const db = await open();
const all = async (sql) => (await db.connection.runAndReadAll(sql)).getRows();

try {
    // the rows, generated once in DuckDB: arrival order across two years, with jitter
    await db.connection.run(`CREATE TABLE src AS SELECT
        (${BASE_MS}::BIGINT + (i * ${SPAN_MS}::BIGINT // ${ROWS}) + (hash(i) % 60000)::BIGINT) AS ms
        FROM range(${ROWS}) t(i)`);

    const lo = BASE_MS + Math.floor(SPAN_MS * 0.40);
    const hi1 = lo + Math.floor(SPAN_MS * 0.01);
    const hi50 = lo + Math.floor(SPAN_MS * 0.50);

    const results = {};
    for (const [name, shape] of Object.entries(ALL)) {
        const path = join(dir, `${name.replace('+', 'plus')}.parquet`);
        const write = await timed(() => db.connection.run(
            `COPY (SELECT ${shape.write} AS d FROM src) TO '${path}' (FORMAT parquet, COMPRESSION zstd)`
        ));
        const bytes = (await stat(path)).size;
        const from = `read_parquet('${path}')`;

        const queries = {
            range1: `SELECT count(*) FROM ${from} WHERE ${shape.range('d', lo, hi1)}`,
            range50: `SELECT count(*) FROM ${from} WHERE ${shape.range('d', lo, hi50)}`,
            hours: `SELECT ${shape.hours('d')} AS h, count(*) FROM ${from} GROUP BY ALL`,
            days: `SELECT date_trunc('day', ${shape.instant('d')}) AS day, count(*) FROM ${from} GROUP BY ALL`,
            topN: `SELECT d FROM ${from} ORDER BY ${shape.instant('d')} DESC LIMIT 100`,
            iso: `SELECT sum(length(${shape.iso('d')})) FROM ${from}`,
        };

        const timings = { writeMs: Math.round(write.ms), mb: +(bytes / 1e6).toFixed(1) };
        const answers = {};
        for (const [query, sql] of Object.entries(queries)) {
            await all(sql); // warm: metadata and page cache
            const runs = [];
            for (let r = 0; r < RUNS; r++) {
                const { ms, result } = await timed(() => all(sql));
                runs.push(ms);
                answers[query] = result;
            }
            timings[query] = +median(runs).toFixed(1);
        }
        results[name] = { timings, answers };
        console.error(name, JSON.stringify(timings));
    }

    // the shapes must AGREE, or the timings compare different work
    const key = (rows) => JSON.stringify(rows, (_k, v) => (typeof v === 'bigint' ? String(v) : v));
    const sortedKey = (rows) => key([...rows].map(key).sort());
    for (const query of ['range1', 'range50']) {
        const counts = Object.values(results).map((r) => key(r.answers[query]));
        if (new Set(counts).size !== 1) throw new Error(`${query} disagrees across shapes: ${counts}`);
    }
    for (const query of ['hours', 'days', 'iso']) {
        const plain = Object.keys(results).filter((n) => !n.endsWith('+'))
            .map((name) => sortedKey(results[name].answers[query]));
        if (new Set(plain).size > 1) throw new Error(`${query} disagrees across the plain shapes`);
        const offset = Object.keys(results).filter((n) => n.endsWith('+'))
            .map((name) => sortedKey(results[name].answers[query]));
        if (new Set(offset).size > 1) throw new Error(`${query} disagrees across the offset shapes`);
    }

    console.log(JSON.stringify({
        rows: ROWS, runs: RUNS,
        timings: Object.fromEntries(Object.entries(results).map(([n, r]) => [n, r.timings])),
    }));
} finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
}
