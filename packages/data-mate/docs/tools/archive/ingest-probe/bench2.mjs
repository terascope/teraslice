// Path F: keep the C++ JSON parse, but do the COERCION ourselves in SQL.
//
// Path B (read_json with explicit target types) is fast but hands coercion to DuckDB's
// cast rules, which diverge from the DataType config on 26 of 40 probed inputs.
// So: read every field UNTYPED (VARCHAR / JSON), then coerce with per-FieldType SQL
// expressions we control. That keeps the fast parse while the DataType stays authoritative.
//
// Same rules as bench.mjs: same input bytes, same materialized end state, equivalence
// verified before any timing is quoted.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { TYPE_CONFIG, DUCK_COLUMNS, makeRecords } from './gen.mjs';

const ROWS = Number(process.argv[2] ?? 200_000);
const REPS = Number(process.argv[3] ?? 5);
const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}f-ndjson.json`;

const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };

const instance = await DuckDBInstance.create(':memory:');
const conn = await instance.connect();
async function one(sql) { return (await (await conn.run(sql)).getRowsJson())[0][0]; }

const records = makeRecords(ROWS);
const arrayBytes = Buffer.from(JSON.stringify(records));
const ndjsonBytes = Buffer.from(records.map((r) => JSON.stringify(r)).join('\n'));
writeFileSync(FILE, ndjsonBytes);

const COLS_TYPED = `{${Object.entries(DUCK_COLUMNS).map(([k, v]) => `'${k}': '${v}'`).join(', ')}}`;

// read everything untyped: scalars as VARCHAR, nested as JSON
const RAW_COLS = `{${[
    '_key', 'ip', 'host', 'bytes', 'total', 'duration', 'ratio', 'level', 'port',
    'active', 'created', 'status', 'label',
].map((k) => `'${k}': 'VARCHAR'`).join(', ')}, 'loc': 'JSON', 'tags': 'JSON', 'meta': 'JSON'}`;

// DataType-faithful coercion expressions.
//  - numbers: strip separators, parse whole value (so '1e3' -> 1000), TRUNCATE not round
//    (data-mate's Integer('12.7') is 12; DuckDB's own cast rounds to 13)
//  - dates: ISO first, then bare epoch-millis, matching data-mate's accepted set
const num = (c) => `TRY_CAST(replace(replace(${c}, ',', ''), '_', '') AS DOUBLE)`;
const int = (c, t) => `CAST(TRUNC(${num(c)}) AS ${t})`;
const COERCE = `
    _key,
    ip,
    host,
    ${int('bytes', 'BIGINT')}  AS bytes,
    ${int('total', 'BIGINT')}  AS total,
    ${num('duration')}         AS duration,
    CAST(${num('ratio')} AS FLOAT) AS ratio,
    ${int('level', 'TINYINT')} AS level,
    ${int('port', 'SMALLINT')} AS port,
    CAST(active AS BOOLEAN)    AS active,
    COALESCE(
        TRY_CAST(created AS TIMESTAMP),
        TRY_CAST(epoch_ms(TRY_CAST(created AS BIGINT)) AS TIMESTAMP)
    ) AS created,
    status,
    label,
    {'lat': TRY_CAST(loc->>'lat' AS DOUBLE), 'lon': TRY_CAST(loc->>'lon' AS DOUBLE)} AS loc,
    CAST(tags AS VARCHAR[])    AS tags,
    {'region': meta->>'region', 'tier': ${int("meta->>'tier'", 'BIGINT')}} AS meta
`;

const paths = {
    async 'A  dm  JSON.parse + DataFrame.fromJSON   [TODAY]'() {
        const f = DataFrame.fromJSON(TYPE_CONFIG, JSON.parse(arrayBytes.toString()));
        return { kind: 'dm', frame: f };
    },
    async 'B  ddb read_json(explicit target types)'() {
        writeFileSync(FILE, ndjsonBytes);
        await conn.run(`CREATE OR REPLACE TABLE tB AS SELECT * FROM read_json('${FILE}', columns = ${COLS_TYPED}, format = 'newline_delimited')`);
        return { kind: 'ddb', table: 'tB' };
    },
    async 'F  ddb read_json(UNTYPED) + SQL coercion we own'() {
        writeFileSync(FILE, ndjsonBytes);
        await conn.run(`CREATE OR REPLACE TABLE tF AS SELECT ${COERCE} FROM read_json('${FILE}', columns = ${RAW_COLS}, format = 'newline_delimited')`);
        return { kind: 'ddb', table: 'tF' };
    },
};

async function fingerprint(out) {
    if (out.kind === 'ddb') {
        const t = out.table;
        return {
            rows: String(await one(`SELECT count(*)::VARCHAR FROM ${t}`)),
            sumBytes: String(await one(`SELECT sum(bytes)::VARCHAR FROM ${t}`)),
            sumLevel: String(await one(`SELECT sum(level)::VARCHAR FROM ${t}`)),
            sumPort: String(await one(`SELECT sum(port)::VARCHAR FROM ${t}`)),
            sumTotal: String(await one(`SELECT sum(total)::VARCHAR FROM ${t}`)),
            sumDur: String(await one(`SELECT round(sum(duration),2)::VARCHAR FROM ${t}`)),
            nActive: String(await one(`SELECT count(*) FILTER (WHERE active)::VARCHAR FROM ${t}`)),
            sumTagLen: String(await one(`SELECT sum(len(tags))::VARCHAR FROM ${t}`)),
            sumLat: String(await one(`SELECT round(sum(loc.lat),3)::VARCHAR FROM ${t}`)),
            sumTier: String(await one(`SELECT sum(meta.tier)::VARCHAR FROM ${t}`)),
            maxCreated: String(await one(`SELECT strftime(max(created), '%Y-%m-%dT%H:%M:%S') FROM ${t}`)),
        };
    }
    const f = out.frame;
    const col = (n) => f.getColumnOrThrow(n).vector.toJSON();
    const sum = (n) => col(n).reduce((a, b) => a + Number(b ?? 0), 0);
    const maxMs = col('created').reduce((a, d) => { const t = d == null ? -Infinity : new Date(d).getTime(); return t > a ? t : a; }, -Infinity);
    return {
        rows: String(f.size),
        sumBytes: String(sum('bytes')),
        sumLevel: String(sum('level')),
        sumPort: String(sum('port')),
        sumTotal: String(sum('total')),
        sumDur: String(Math.round(sum('duration') * 100) / 100),
        nActive: String(col('active').filter((v) => v === true).length),
        sumTagLen: String(col('tags').reduce((a, t) => a + (t?.length ?? 0), 0)),
        sumLat: String(Math.round(col('loc').reduce((a, p) => a + (p?.lat ?? 0), 0) * 1000) / 1000),
        sumTier: String(col('meta').reduce((a, m) => a + Number(m?.tier ?? 0), 0)),
        maxCreated: new Date(maxMs).toISOString().slice(0, 19),
    };
}

console.log(`rows=${ROWS} reps=${REPS}\n--- equivalence (must match before timing) ---`);
const fps = {};
for (const [n, fn] of Object.entries(paths)) {
    try { fps[n] = await fingerprint(await fn()); } catch (e) { fps[n] = { error: e.message.slice(0, 100) }; }
}
const base = fps[Object.keys(fps)[0]];
for (const [n, f] of Object.entries(fps)) {
    if (f.error) { console.log(`  ${n.padEnd(50)} ERROR ${f.error}`); continue; }
    const d = Object.keys(base).filter((c) => String(base[c]) !== String(f[c]));
    console.log(`  ${n.padEnd(50)} ${d.length ? `DIFFERS: ${d.map((x) => `${x} ${base[x]}->${f[x]}`).join(', ')}` : 'match'}`);
}

console.log('\n--- bytes -> materialized (median) ---');
const T = {};
for (const [n, fn] of Object.entries(paths)) {
    const runs = [];
    try {
        await fn();
        for (let i = 0; i < REPS; i++) { global.gc?.(); const t = hr(); await fn(); runs.push(hr() - t); }
    } catch (e) { console.log(`  ${n.padEnd(50)} ERROR`); continue; }
    T[n] = median(runs);
    console.log(`  ${n.padEnd(50)} ${median(runs).toFixed(0).padStart(7)} ms  [${runs.map((r) => r.toFixed(0)).join(' ')}]`);
}
const A = T['A  dm  JSON.parse + DataFrame.fromJSON   [TODAY]'];
console.log('\n--- vs today ---');
for (const [k, v] of Object.entries(T)) if (v !== A) console.log(`  ${k.padEnd(50)} ${(A / v).toFixed(1)}x faster`);

// does our SQL coercion reproduce data-mate's truncation, where DuckDB's own cast rounds?
console.log('\n--- semantics spot-check: Integer(12.7) and Integer("1e3") ---');
writeFileSync(`${DIR}spot.json`, JSON.stringify({ a: 12.7, b: '1e3', c: '1,000' }));
const spotRaw = `read_json('${DIR}spot.json', columns = {'a':'VARCHAR','b':'VARCHAR','c':'VARCHAR'}, format='newline_delimited')`;
console.log('  ours  (TRUNC of full parse):', JSON.stringify(await (await conn.run(
    `SELECT ${int('a', 'BIGINT')} AS a, ${int('b', 'BIGINT')} AS b, ${int('c', 'BIGINT')} AS c FROM ${spotRaw}`)).getRowsJson()));
console.log('  ddb   (explicit BIGINT col):',
    await (async () => { try { writeFileSync(`${DIR}spot2.json`, JSON.stringify({ a: 12.7 })); return JSON.stringify(await (await conn.run(`SELECT a FROM read_json('${DIR}spot2.json', columns={'a':'BIGINT'}, format='newline_delimited')`)).getRowsJson()); } catch (e) { return `THROWS ${e.message.slice(0, 40)}`; } })());
const dmF = DataFrame.fromJSON({ version: 1, fields: { a: { type: 'Integer' }, b: { type: 'Integer' }, c: { type: 'Integer' } } }, [{ a: 12.7, b: '1e3', c: '1,000' }]);
console.log('  data-mate                  :', JSON.stringify(['a', 'b', 'c'].map((k) => dmF.getColumnOrThrow(k).vector.toJSON()[0])));
