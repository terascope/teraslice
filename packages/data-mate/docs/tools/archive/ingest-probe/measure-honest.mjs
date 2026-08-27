// CORRECTION. My earlier benchmarks started from raw JSON BYTES and treated
// JSON.parse as a cost the DuckDB path avoids. That premise is wrong for the boundary
// where coercion actually happens.
//
// Verified in the spaces source:
//   ES client -> ClientResponse.SearchResponse (ALREADY PARSED JS OBJECTS)
//   -> getHits() -> hits.hits -> per-hit `_source` extraction in JS
//   -> records array -> formatData() -> DataFrame.fromJSON(typeConfig, results)
//
// So at the point fromJSON runs there are no bytes - there are JS objects. To feed
// read_json we must JSON.stringify them BACK to text, a step the current path never
// pays. This measures that honestly.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance, DuckDBDataChunk, timestampValue } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { buildIngestSql, buildFailureCountSql } from '@terascope/data-mate/dist/src/duck-frame/ingest-sql.js';

const ROWS = Number(process.argv[2] ?? 1_000_000);
const REPS = Number(process.argv[3] ?? 3);
const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}honest.json`;

const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };
const conn = await (await DuckDBInstance.create(':memory:')).connect();
const one = async (sql) => (await (await conn.run(sql)).getRowsJson())[0][0];

const CONFIG = {
    version: 1,
    fields: {
        _key: { type: 'Keyword' }, host: { type: 'Keyword' }, label: { type: 'Text' },
        status: { type: 'Keyword' }, bytes: { type: 'Integer' }, total: { type: 'Long' },
        duration: { type: 'Double' }, ratio: { type: 'Float' }, level: { type: 'Byte' },
        port: { type: 'Short' }, active: { type: 'Boolean' },
    },
};
const DDL = `(_key VARCHAR, host VARCHAR, label VARCHAR, status VARCHAR, bytes BIGINT,
    total HUGEINT, duration DOUBLE, ratio DOUBLE, level TINYINT, port SMALLINT, active BOOLEAN)`;

function lcg(s0) { let s = s0 >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function makeRecords(n) {
    const r = lcg(7); const out = new Array(n);
    for (let i = 0; i < n; i++) {
        out[i] = {
            _key: `k-${i}`, host: `host-${Math.floor(r() * 5000)}.example.com`,
            label: `event ${Math.floor(r() * 100000)} recorded`,
            status: ['ok', 'warn', 'error'][Math.floor(r() * 3)],
            bytes: Math.floor(r() * 2_000_000), total: Math.floor(r() * 9_000_000_000),
            duration: Math.round(r() * 1e6) / 1000, ratio: Math.round(r() * 1e4) / 1e4,
            level: Math.floor(r() * 120), port: Math.floor(r() * 32000), active: r() > 0.5,
        };
    }
    return out;
}

// THE INPUT: parsed JS objects, which is what the ES client hands us
const records = makeRecords(ROWS);
console.log(`rows=${ROWS} reps=${REPS}`);
console.log('input = an array of already-parsed JS objects (what the ES client returns)\n');

const ingest = buildIngestSql(CONFIG, 'h', { source: FILE, format: 'newline_delimited', mode: 'strict' });

async function timeIt(label, fn, note = '') {
    await fn();
    const runs = [];
    for (let i = 0; i < REPS; i++) { global.gc?.(); const t = hr(); await fn(); runs.push(hr() - t); }
    const m = median(runs);
    console.log(`  ${label.padEnd(50)} ${m.toFixed(0).padStart(6)} ms  ${note}`);
    return m;
}

console.log('--- the honest comparison, all starting from JS objects ---');
const tDm = await timeIt('A  dm  fromJSON(objects)              [TODAY]', async () => {
    DataFrame.fromJSON(CONFIG, records);
});

const tStringify = await timeIt('   (component) JSON.stringify to ndjson', async () => {
    Buffer.from(records.map((x) => JSON.stringify(x)).join('\n'));
}, 'the step the current path never pays');

const tDuckStr = await timeIt('B  duck stringify -> file -> read_json + coerce', async () => {
    writeFileSync(FILE, Buffer.from(records.map((x) => JSON.stringify(x)).join('\n')));
    await conn.run(ingest.sql);
    const bad = Number(await one(buildFailureCountSql('h')));
    if (bad > 0) throw new Error('unexpected failure');
});

const CHUNK_TYPES = await (async () => {
    await conn.run(`CREATE OR REPLACE TABLE probe ${DDL}`);
    const r = await conn.run('SELECT * FROM probe LIMIT 0');
    return r.columnTypes();
})();

const tDuckApp = await timeIt('C  duck per-row JS appender (no serialize)', async () => {
    await conn.run(`CREATE OR REPLACE TABLE hc ${DDL}`);
    const app = await conn.createAppender('hc');
    for (let off = 0; off < records.length; off += 2048) {
        const w = records.slice(off, off + 2048);
        const ch = DuckDBDataChunk.create(CHUNK_TYPES, w.length);
        ch.setColumns([
            w.map((x) => x._key), w.map((x) => x.host), w.map((x) => x.label),
            w.map((x) => x.status), w.map((x) => BigInt(x.bytes)), w.map((x) => BigInt(x.total)),
            w.map((x) => x.duration), w.map((x) => x.ratio),
            w.map((x) => x.level), w.map((x) => x.port), w.map((x) => x.active),
        ]);
        app.appendDataChunk(ch);
    }
    app.flushSync(); app.closeSync();
});

console.log('\n--- what this means ---');
console.log(`  stringify alone is ${(100 * tStringify / tDuckStr).toFixed(0)}% of the whole read_json path`);
console.log(`  B (stringify + read_json) vs today: ${(tDm / tDuckStr).toFixed(2)}x`);
console.log(`  C (per-row appender)      vs today: ${(tDm / tDuckApp).toFixed(2)}x`);

// and the number my earlier benchmark reported, for contrast: bytes handed over free
writeFileSync(FILE, Buffer.from(records.map((x) => JSON.stringify(x)).join('\n')));
const tPrePaid = await timeIt('   read_json + coerce with bytes ALREADY on disk', async () => {
    await conn.run(ingest.sql);
    await one(buildFailureCountSql('h'));
}, '<- what I previously reported');
console.log(`\n  previously-reported ratio (bytes free): ${(tDm / tPrePaid).toFixed(2)}x`);
console.log(`  honest ratio (bytes must be produced): ${(tDm / tDuckStr).toFixed(2)}x`);
