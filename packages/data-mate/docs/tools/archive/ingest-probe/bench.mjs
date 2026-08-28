// Does read_json beat the per-row JS paths for getting search-API bytes into a frame?
//
// APPLES-TO-APPLES RULES, enforced deliberately:
//  1. EVERY path starts from the SAME raw JSON bytes, exactly as they arrive off the
//     search API HTTP response. No path may start from a pre-parsed JS array, and no
//     path may start from a file it did not pay to write. (That second rule is the flaw
//     in bench/extra/reader-path-wire.mjs, where the parquet reader consumed files whose
//     production cost was timed separately and excluded.)
//  2. EVERY path ends MATERIALIZED - a DataFrame in memory, or a DuckDB TABLE. The lazy
//     VIEW is measured too but reported separately and never compared to a materialized
//     frame, because it has not touched the data yet.
//  3. EVERY path's output is verified equivalent (row count + aggregate checksums) BEFORE
//     any timing is quoted. A path that silently nulls values is not faster, it is wrong.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance, DuckDBDataChunk, structValue, listValue, timestampValue } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { TYPE_CONFIG, DUCK_COLUMNS, DDL, makeRecords } from './gen.mjs';

const ROWS = Number(process.argv[2] ?? 200_000);
const REPS = Number(process.argv[3] ?? 5);
const DIR = new URL('.', import.meta.url).pathname;

const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };

const instance = await DuckDBInstance.create(':memory:');
const conn = await instance.connect();
const scalar = async (sql) => (await conn.run(sql)).getRowsJson?.() ?? null;
async function one(sql) {
    const r = await conn.run(sql);
    const rows = await r.getRowsJson();
    return rows[0][0];
}

// ---- the input: one canonical record set, two byte representations ----
const records = makeRecords(ROWS);
const arrayBytes = Buffer.from(JSON.stringify(records));            // what the search API returns
const ndjsonBytes = Buffer.from(records.map((r) => JSON.stringify(r)).join('\n'));
const ARRAY_FILE = `${DIR}in-array.json`;
const NDJSON_FILE = `${DIR}in-ndjson.json`;

console.log(`rows=${ROWS}  reps=${REPS}  array=${(arrayBytes.length / 1048576).toFixed(1)}MB  ndjson=${(ndjsonBytes.length / 1048576).toFixed(1)}MB`);
console.log(`platform=${process.platform}  (no /dev/shm on darwin - see note at end)\n`);

const COLS = `{${Object.entries(DUCK_COLUMNS).map(([k, v]) => `'${k}': '${v}'`).join(', ')}}`;

// ---- the paths. each takes raw bytes, returns a materialized thing ----
const paths = {
    async 'A  dm  JSON.parse + DataFrame.fromJSON        [TODAY]'() {
        const recs = JSON.parse(arrayBytes.toString());
        const f = DataFrame.fromJSON(TYPE_CONFIG, recs);
        return { kind: 'dm', frame: f, size: f.size };
    },

    async 'B  ddb write ndjson + read_json(explicit cols)'() {
        writeFileSync(NDJSON_FILE, ndjsonBytes);
        await conn.run(`CREATE OR REPLACE TABLE tB AS SELECT * FROM
            read_json('${NDJSON_FILE}', columns = ${COLS}, format = 'newline_delimited')`);
        return { kind: 'ddb', table: 'tB', size: Number(await one('SELECT count(*) FROM tB')) };
    },

    async 'C  ddb write array  + read_json(explicit cols)'() {
        writeFileSync(ARRAY_FILE, arrayBytes);
        await conn.run(`CREATE OR REPLACE TABLE tC AS SELECT * FROM
            read_json('${ARRAY_FILE}', columns = ${COLS}, format = 'array')`);
        return { kind: 'ddb', table: 'tC', size: Number(await one('SELECT count(*) FROM tC')) };
    },

    async 'D  ddb write ndjson + read_json(INFERRED cols)'() {
        writeFileSync(NDJSON_FILE, ndjsonBytes);
        await conn.run(`CREATE OR REPLACE TABLE tD AS SELECT * FROM
            read_json('${NDJSON_FILE}', format = 'newline_delimited')`);
        return { kind: 'ddb', table: 'tD', size: Number(await one('SELECT count(*) FROM tD')) };
    },

    async 'E  ddb JSON.parse + per-row JS appender'() {
        const recs = JSON.parse(arrayBytes.toString());
        await conn.run(`CREATE OR REPLACE TABLE tE ${DDL}`);
        const types = (await conn.run('SELECT * FROM tE LIMIT 0')).deduplicatedColumnTypes?.()
            ?? (await conn.run('SELECT * FROM tE LIMIT 0')).columnTypes();
        const app = await conn.createAppender('tE');
        for (let off = 0; off < recs.length; off += 2048) {
            const w = recs.slice(off, off + 2048);
            const ch = DuckDBDataChunk.create(types, w.length);
            ch.setColumns([
                w.map((r) => r._key), w.map((r) => r.ip), w.map((r) => r.host),
                w.map((r) => BigInt(r.bytes)), w.map((r) => BigInt(r.total)), w.map((r) => r.duration),
                w.map((r) => r.ratio), w.map((r) => r.level), w.map((r) => r.port),
                w.map((r) => r.active),
                w.map((r) => timestampValue(BigInt(Date.parse(r.created)) * 1000n)),
                w.map((r) => r.status), w.map((r) => r.label),
                w.map((r) => structValue({ lat: r.loc.lat, lon: r.loc.lon })),
                w.map((r) => listValue(r.tags)),
                w.map((r) => structValue({ region: r.meta.region, tier: BigInt(r.meta.tier) })),
            ]);
            app.appendDataChunk(ch);
        }
        app.flushSync(); app.closeSync();
        return { kind: 'ddb', table: 'tE', size: Number(await one('SELECT count(*) FROM tE')) };
    },
};

// ---- equivalence: verify the paths produced the SAME DATA before timing anything ----
async function fingerprint(out) {
    if (out.kind === 'ddb') {
        const t = out.table;
        return {
            rows: out.size,
            sumBytes: String(await one(`SELECT sum(bytes)::VARCHAR FROM ${t}`)),
            sumLevel: String(await one(`SELECT sum(level)::VARCHAR FROM ${t}`)),
            nonNullIp: String(await one(`SELECT count(ip)::VARCHAR FROM ${t}`)),
            distinctStatus: String(await one(`SELECT count(DISTINCT status)::VARCHAR FROM ${t}`)),
            sumTagLen: String(await one(`SELECT sum(len(tags))::VARCHAR FROM ${t}`)),
            sumLat: String(await one(`SELECT round(sum(loc.lat),3)::VARCHAR FROM ${t}`)),
            maxCreated: String(await one(`SELECT strftime(max(created), '%Y-%m-%dT%H:%M:%S') FROM ${t}`)),
        };
    }
    const f = out.frame;
    const col = (n) => f.getColumnOrThrow(n).vector.toJSON();
    const sum = (n) => col(n).reduce((a, b) => a + Number(b ?? 0), 0);
    // reduce, never spread: 200k spread args overflows the call stack
    const maxCreatedMs = col('created').reduce((a, d) => {
        const t = d == null ? -Infinity : new Date(d).getTime();
        return t > a ? t : a;
    }, -Infinity);
    const pt = (p) => (typeof p === 'string' ? { lat: Number(p.split(',')[0]), lon: Number(p.split(',')[1]) } : p);
    return {
        rows: f.size,
        sumBytes: String(sum('bytes')),
        sumLevel: String(sum('level')),
        nonNullIp: String(col('ip').filter((v) => v != null).length),
        distinctStatus: String(new Set(col('status')).size),
        sumTagLen: String(col('tags').reduce((a, t) => a + (t?.length ?? 0), 0)),
        sumLat: String(Math.round(col('loc').reduce((a, p) => a + (pt(p)?.lat ?? 0), 0) * 1000) / 1000),
        maxCreated: new Date(maxCreatedMs).toISOString().slice(0, 19),
    };
}

console.log('--- equivalence check (must match before any timing is quoted) ---');
const fps = {};
for (const [name, fn] of Object.entries(paths)) {
    try { fps[name] = await fingerprint(await fn()); } catch (e) { fps[name] = { error: e.message.slice(0, 90) }; }
}
const keys = Object.keys(fps);
const base = fps[keys[0]];
for (const k of keys) {
    const f = fps[k];
    if (f.error) { console.log(`  ${k.padEnd(52)} ERROR ${f.error}`); continue; }
    const diffs = Object.keys(base).filter((c) => String(base[c]) !== String(f[c]));
    console.log(`  ${k.padEnd(52)} ${diffs.length === 0 ? 'match' : `DIFFERS: ${diffs.map((d) => `${d} ${base[d]}->${f[d]}`).join(', ')}`}`);
}

// ---- timing ----
console.log('\n--- bytes -> materialized (median of reps) ---');
const timings = {};
for (const [name, fn] of Object.entries(paths)) {
    const runs = [];
    try {
        await fn(); // warmup, not counted
        for (let i = 0; i < REPS; i++) {
            global.gc?.();
            const t = hr();
            await fn();
            runs.push(hr() - t);
        }
    } catch (e) { console.log(`  ${name.padEnd(52)}  ERROR ${e.message.slice(0, 60)}`); continue; }
    timings[name] = median(runs);
    console.log(`  ${name.padEnd(52)} ${median(runs).toFixed(0).padStart(7)} ms   [${runs.map((r) => r.toFixed(0)).join(' ')}]`);
}

// ---- component breakdown: how much of B is the file write vs the parse? ----
console.log('\n--- component costs ---');
{
    const runs = [];
    for (let i = 0; i < REPS; i++) { const t = hr(); writeFileSync(NDJSON_FILE, ndjsonBytes); runs.push(hr() - t); }
    console.log(`  write ${(ndjsonBytes.length / 1048576).toFixed(0)}MB ndjson to disk`.padEnd(54) + `${median(runs).toFixed(0).padStart(7)} ms`);
}
{
    const runs = [];
    for (let i = 0; i < REPS; i++) { global.gc?.(); const t = hr(); JSON.parse(arrayBytes.toString()); runs.push(hr() - t); }
    console.log('  JSON.parse of array bytes (JS side only)'.padEnd(54) + `${median(runs).toFixed(0).padStart(7)} ms`);
}
{
    writeFileSync(NDJSON_FILE, ndjsonBytes);
    const runs = [];
    for (let i = 0; i < REPS; i++) {
        const t = hr();
        await conn.run(`CREATE OR REPLACE VIEW vB AS SELECT * FROM read_json('${NDJSON_FILE}', columns = ${COLS}, format = 'newline_delimited')`);
        await one('SELECT count(*) FROM vB');
        runs.push(hr() - t);
    }
    console.log('  read_json as lazy VIEW + count(*) [NOT materialized]'.padEnd(54) + `${median(runs).toFixed(0).padStart(7)} ms`);
}

// ---- downstream: a real aggregate, so nothing wins by being lazy ----
console.log('\n--- downstream groupBy status (over the materialized result) ---');
{
    const f = DataFrame.fromJSON(TYPE_CONFIG, JSON.parse(arrayBytes.toString()));
    const runs = [];
    for (let i = 0; i < REPS; i++) { const t = hr(); await f.aggregate().groupBy('status').count('_key').run(); runs.push(hr() - t); }
    console.log('  dm  aggregate groupBy'.padEnd(54) + `${median(runs).toFixed(0).padStart(7)} ms`);
}
{
    const runs = [];
    for (let i = 0; i < REPS; i++) { const t = hr(); await one('SELECT count(*) FROM (SELECT status, count(_key) FROM tB GROUP BY status)'); runs.push(hr() - t); }
    console.log('  ddb GROUP BY over table tB'.padEnd(54) + `${median(runs).toFixed(0).padStart(7)} ms`);
}

const A = timings['A  dm  JSON.parse + DataFrame.fromJSON        [TODAY]'];
console.log('\n--- ratios vs today (A), materialized-to-materialized ---');
for (const [k, v] of Object.entries(timings)) {
    if (v === A) continue;
    console.log(`  ${k.slice(0, 50).padEnd(52)} ${(v / A).toFixed(2)}x  ${v < A ? 'FASTER' : 'slower'}`);
}
