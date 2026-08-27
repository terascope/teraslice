// What does the strict-mode failure-detection pass actually COST?
//
// I claimed it "should be cheap (the GROUP BY over 1M rows was 3 ms)" but had not
// measured it. This measures it, and checks that it actually catches a bad value and
// reports it usefully - a detector that is cheap but does not fire is worthless.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import {
    buildIngestSql, buildFailureCountSql, buildFailureDiagnosisSql, buildDropFailureColumnSql
} from '@terascope/data-mate/dist/src/duck-frame/ingest-sql.js';

const ROWS = Number(process.argv[2] ?? 1_000_000);
const REPS = Number(process.argv[3] ?? 3);
const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}strict.json`;

const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };
const conn = await (await DuckDBInstance.create(':memory:')).connect();
const one = async (sql) => (await (await conn.run(sql)).getRowsJson())[0][0];

// only the field types the coercion layer implements so far
const CONFIG = {
    version: 1,
    fields: {
        _key: { type: 'Keyword' },
        host: { type: 'Keyword' },
        label: { type: 'Text' },
        status: { type: 'Keyword' },
        bytes: { type: 'Integer' },
        total: { type: 'Long' },
        duration: { type: 'Double' },
        ratio: { type: 'Float' },
        level: { type: 'Byte' },
        port: { type: 'Short' },
        active: { type: 'Boolean' },
    },
};

function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function makeRecords(n, { poison = -1 } = {}) {
    const r = lcg(7); const out = new Array(n);
    for (let i = 0; i < n; i++) {
        out[i] = {
            _key: `k-${i}`,
            host: `host-${Math.floor(r() * 5000)}.example.com`,
            label: `event ${Math.floor(r() * 100000)} recorded`,
            status: ['ok', 'warn', 'error'][Math.floor(r() * 3)],
            bytes: Math.floor(r() * 2_000_000),
            total: Math.floor(r() * 9_000_000_000),
            duration: Math.round(r() * 1e6) / 1000,
            ratio: Math.round(r() * 1e4) / 1e4,
            level: Math.floor(r() * 120),
            port: Math.floor(r() * 32000),
            active: r() > 0.5,
        };
        // one poisoned row, the once-a-quarter case: a Byte that cannot hold it
        if (i === poison) out[i].level = '1e3';
    }
    return out;
}

const clean = Buffer.from(makeRecords(ROWS).map((x) => JSON.stringify(x)).join('\n'));
console.log(`rows=${ROWS} reps=${REPS} bytes=${(clean.length / 1048576).toFixed(0)}MB\n`);

const opts = { source: FILE, format: 'newline_delimited' };
const strict = buildIngestSql(CONFIG, 'ing_strict', { ...opts, mode: 'strict' });
const lenient = buildIngestSql(CONFIG, 'ing_lenient', { ...opts, mode: 'lenient' });

async function timeIt(label, fn) {
    await fn();
    const runs = [];
    for (let i = 0; i < REPS; i++) { global.gc?.(); const t = hr(); await fn(); runs.push(hr() - t); }
    console.log(`  ${label.padEnd(52)} ${median(runs).toFixed(0).padStart(6)} ms  [${runs.map((r) => r.toFixed(0)).join(' ')}]`);
    return median(runs);
}

writeFileSync(FILE, clean);
console.log('--- cost of the strict-mode detection pass ---');
const tLenient = await timeIt('lenient: coerce only (pipeline shape)', async () => {
    writeFileSync(FILE, clean);
    await conn.run(lenient.sql);
});
const tStrictIngest = await timeIt('strict: coerce + failure flag column', async () => {
    writeFileSync(FILE, clean);
    await conn.run(strict.sql);
});
const tCheck = await timeIt('strict: the count(*) check over the flag', async () => {
    await one(buildFailureCountSql('ing_strict'));
});
const tFull = await timeIt('strict: ingest + check + drop flag column', async () => {
    writeFileSync(FILE, clean);
    await conn.run(strict.sql);
    const bad = Number(await one(buildFailureCountSql('ing_strict')));
    if (bad > 0) throw new Error('unexpected');
    await conn.run(buildDropFailureColumnSql('ing_strict'));
});

const overhead = ((tFull / tLenient - 1) * 100).toFixed(0);
console.log(`\n  strict overhead vs lenient: ${overhead}%  (${tFull.toFixed(0)} vs ${tLenient.toFixed(0)} ms)`);
console.log(`  the check alone: ${tCheck.toFixed(1)} ms`);

// baseline for scale
const recs = makeRecords(ROWS);
const dmT = await timeIt('data-mate fromJSON, same 11 fields [TODAY]', async () => {
    DataFrame.fromJSON(CONFIG, recs);
});
console.log(`\n  strict ingest is ${(dmT / tFull).toFixed(1)}x faster than data-mate today`);

// --- does it actually catch the bad value, and say something useful? ---
console.log('\n--- detection correctness: one poisoned row in ' + ROWS + ' ---');
const poisonAt = Math.floor(ROWS / 2);
writeFileSync(FILE, Buffer.from(makeRecords(ROWS, { poison: poisonAt }).map((x) => JSON.stringify(x)).join('\n')));
await conn.run(strict.sql);
const badRows = Number(await one(buildFailureCountSql('ing_strict')));
console.log(`  rows flagged: ${badRows}   (expected 1, poisoned row ${poisonAt} with Byte <- '1e3')`);

const diag = await (await conn.run(buildFailureDiagnosisSql(CONFIG, opts))).getRowsJson();
console.log('  diagnosis (non-zero only):');
for (const [field, type, count, example] of diag) {
    if (Number(count) > 0) console.log(`    field=${field} type=${type} failed=${count} example=${JSON.stringify(example)}`);
}

// and confirm data-mate agrees this is a failure
try {
    DataFrame.fromJSON(CONFIG, makeRecords(10, { poison: 5 }));
    console.log('  data-mate on the same input: ACCEPTED (divergence!)');
} catch (e) {
    console.log(`  data-mate on the same input: throws -> ${e.message.split(';')[0].slice(0, 62)}`);
}
