/* eslint-disable no-console -- a bench: its result IS the console output */
/**
 * What does an IP field cost stored as TEXT (today) against DuckDB's native `INET`?
 *
 * Today an `IP` field is a VARCHAR holding the address exactly as it arrived, and every IP query
 * parses it per row: sql-builder emits `TRY_CAST(ip AS INET)` - with IPv4 mapped into IPv6 so
 * `::ffff:8.8.8.8` and `8.8.8.8` are one address - for every CIDR, equality and range filter.
 * Storing `INET` would parse once at ingest. This measures what that per-row parse actually costs.
 *
 * **A runs the EXACT SQL sql-builder emits** for an IP field today: per row, `contains(ip, ':')`,
 * `'::ffff:' || ip` for IPv4, then `TRY_CAST(... AS INET)`. **B is the best INET design**: the
 * address stored ALREADY MAPPED into IPv6 at ingest, so a filter is the same comparison against the
 * bare column (the same dialect, with the per-row mapping made a no-op) - and output pays to turn
 * `::ffff:1.2.3.4` back into `1.2.3.4`.
 *
 *   A  VARCHAR                    today
 *   B  INET, IPv4 mapped to IPv6  parsed and mapped once, at write time
 *
 * **INET does not survive Parquet** - it reads back as `STRUCT(ip_type, address DOUBLE, mask)`,
 * its 128-bit address narrowed to a DOUBLE (DF14's trap) - so the queries run over in-memory
 * TABLES, the best case for INET; the Parquet columns report the file size and what comes back.
 *
 * Measured warm, median of RUNS:
 *   write       COPY to Parquet, and the file size
 *   cidr8       ip:"10.0.0.0/8"            - broad CIDR filter
 *   cidr24      ip:"192.168.1.0/24"        - selective CIDR filter
 *   equals      ip:"<one address>"
 *   range       ip:[10.0.0.0 TO 10.255.255.255]
 *   parse       count(TRY_CAST(ip AS INET)) against count(ip) - the bare parse, nothing else
 *   render      the address back as text, for output - B pays here, A does not
 *
 * Corpus: 85% IPv4 spread over the whole space, 15% IPv6 under 2001:db8::/32, deterministic.
 *
 * Run:  node packages/data-mate/docs/tools/bench/ip-shape.mjs
 *       ROWS=1000000 RUNS=3 node .../ip-shape.mjs
 */
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { open } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS ?? 10_000_000);
const RUNS = Number(process.env.RUNS ?? 5);

const fromDataMate = createRequire(new URL('../../../package.json', import.meta.url));
const { getSQLDialect, DuckDBDialect } = await import(
    pathToFileURL(fromDataMate.resolve('@terascope/sql-builder')).href
);
const { xLuceneFieldType } = await import(
    pathToFileURL(fromDataMate.resolve('@terascope/types')).href
);

const dialect = getSQLDialect('duckdb');
const ip = dialect.fieldRef('ip');

/** The same SQL over a column that already holds the mapped `INET`: no per-row parse or mapping. */
class NativeInetDialect extends DuckDBDialect {
    mappedInet(fieldExpr) {
        return fieldExpr;
    }
}
const native = new NativeInetDialect();

/** The corpus: IPv4 from a 32-bit hash, IPv6 from two 64-bit ones. */
const IPV4 = 'concat_ws(\'.\', (h4 >> 24) & 255, (h4 >> 16) & 255, (h4 >> 8) & 255, h4 & 255)';
const IPV6 = 'concat(\'2001:db8:\', printf(\'%x:%x:%x:%x:%x:%x\', (h >> 48) & 65535, (h >> 32) & 65535,'
    + ' (h >> 16) & 65535, h & 65535, (g >> 16) & 65535, g & 65535))';

function queries(d, sample) {
    return {
        cidr8: d.ipInCIDR(ip, '10.0.0.0/8'),
        cidr24: d.ipInCIDR(ip, '192.168.1.0/24'),
        equals: d.ipEquals(ip, sample),
        range: `${d.compare(ip, 'gte', '10.0.0.0', xLuceneFieldType.IP)}`
            + ` AND ${d.compare(ip, 'lte', '10.255.255.255', xLuceneFieldType.IP)}`,
    };
}

const MAPPED = 'TRY_CAST(CASE WHEN contains(text, \':\') THEN text ELSE \'::ffff:\' || text END AS INET)';

const SHAPES = {
    A: {
        dialect,
        write: 'text',
        parse: 'count(TRY_CAST(CASE WHEN contains(ip, \':\') THEN ip ELSE \'::ffff:\' || ip END AS INET))',
        render: 'sum(length(ip))',
    },
    B: {
        dialect: native,
        write: MAPPED,
        parse: 'count(ip)',
        // back to the text an IPv4 address arrived as
        render: 'sum(length(CASE WHEN ip <<= INET \'::ffff:0:0/96\''
            + ' THEN replace(host(ip), \'::ffff:\', \'\') ELSE host(ip) END))',
    },
};

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

async function timed(run) {
    const start = process.hrtime.bigint();
    const result = await run();
    return { ms: Number(process.hrtime.bigint() - start) / 1e6, result };
}

const dir = await mkdtemp(join(tmpdir(), 'ip-shape-'));
const db = await open();
const all = async (sql) => (await db.connection.runAndReadAll(sql)).getRows();

try {
    await db.connection.run('LOAD inet');
    await db.connection.run(`CREATE TABLE src AS
        SELECT CASE WHEN i % 20 < 17 THEN ${IPV4} ELSE ${IPV6} END AS text
        FROM (SELECT i, hash(i) & 4294967295 AS h4, hash(i) AS h, hash(i + ${ROWS}) AS g
              FROM range(${ROWS}) t(i))`);

    const [[sample]] = await all('SELECT text FROM src WHERE text LIKE \'%.%\' LIMIT 1 OFFSET 12345');

    const results = {};
    for (const [name, shape] of Object.entries(SHAPES)) {
        const path = join(dir, `${name}.parquet`);
        const write = await timed(() => db.connection.run(
            `COPY (SELECT ${shape.write} AS ip FROM src) TO '${path}' (FORMAT parquet, COMPRESSION zstd)`
        ));
        const [[storedType]] = await all(`SELECT typeof(ip) FROM read_parquet('${path}') LIMIT 1`);
        await db.connection.run(`CREATE TABLE shape_${name} AS SELECT ${shape.write} AS ip FROM src`);
        const from = `shape_${name}`;

        const sqls = {
            ...Object.fromEntries(Object.entries(queries(shape.dialect, sample))
                .map(([q, where]) => [q, `SELECT count(*) FROM ${from} WHERE ${where}`])),
            parse: `SELECT ${shape.parse} FROM ${from}`,
            render: `SELECT ${shape.render} FROM ${from}`,
        };

        const timings = {
            mb: +((await stat(path)).size / 1e6).toFixed(1),
            writeMs: Math.round(write.ms),
            readsBackAs: storedType,
        };
        const answers = {};
        for (const [q, sql] of Object.entries(sqls)) {
            await all(sql);
            const runs = [];
            for (let r = 0; r < RUNS; r++) {
                const { ms, result } = await timed(() => all(sql));
                runs.push(ms);
                answers[q] = String(result[0][0]);
            }
            timings[q] = +median(runs).toFixed(1);
        }
        results[name] = { timings, answers };
        console.error(name, JSON.stringify(timings));
    }

    // both shapes must answer every filter identically, or the timings compare different work
    for (const q of Object.keys(queries(dialect, sample))) {
        if (results.A.answers[q] !== results.B.answers[q]) {
            throw new Error(`${q} disagrees: A=${results.A.answers[q]} B=${results.B.answers[q]}`);
        }
    }

    // an IPv6 address through Parquet as INET: what comes back
    const v6 = '2001:db8:1234:5678:9abc:def0:1234:5679';
    const wire = join(dir, 'wire.parquet');
    await db.connection.run(`COPY (SELECT INET '${v6}' AS ip) TO '${wire}' (FORMAT parquet)`);
    const [[wireBack]] = await all(`SELECT CAST(ip AS VARCHAR) FROM read_parquet('${wire}')`);

    // does INET keep the text a caller sent? (DataFrame returns an IP exactly as given)
    const spellings = ['2001:DB8::1',
        '2001:0db8:0000:0000:0000:0000:0000:0001',
        '::ffff:1.2.3.4',
        '10.0.0.1',
        'fe80::1%eth0'];
    const roundTrip = [];
    for (const text of spellings) {
        const [[back]] = await all(`SELECT CAST(TRY_CAST('${text}' AS INET) AS VARCHAR)`);
        roundTrip.push({ in: text, out: back });
    }

    console.log(JSON.stringify({
        rows: ROWS,
        runs: RUNS,
        sample,
        counts: results.A.answers,
        timings: { A: results.A.timings, B: results.B.timings },
        roundTrip,
        parquetWire: { in: v6, out: wireBack },
    }));
} finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
}
