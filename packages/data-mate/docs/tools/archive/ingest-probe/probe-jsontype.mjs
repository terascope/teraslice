// Reading raw columns as JSON instead of VARCHAR should preserve the original JSON
// type, which is what distinguishes `true` from `"true"`. Before redesigning around
// that, establish exactly what DuckDB gives back.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';

const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}jt.json`;
const conn = await (await DuckDBInstance.create(':memory:')).connect();

// raw JSON text per case, written verbatim so the JSON type is exactly what we mean
const CASES = [
    ['string "12"', '{"v": "12"}'],
    ['string "true"', '{"v": "true"}'],
    ['string "abc"', '{"v": "abc"}'],
    ['string ""', '{"v": ""}'],
    ['number 12', '{"v": 12}'],
    ['number 12.7', '{"v": 12.7}'],
    ['number 1e21', '{"v": 1e21}'],
    ['number -3', '{"v": -3}'],
    ['bool true', '{"v": true}'],
    ['bool false', '{"v": false}'],
    ['null', '{"v": null}'],
    ['missing key', '{}'],
    ['big int 9007199254740993', '{"v": 9007199254740993}'],
];

const EXPRS = {
    'json_type(v)': 'json_type(v)',
    "v ->> '$'": "(v ->> '$')",
    'CAST(v AS VARCHAR)': 'CAST(v AS VARCHAR)',
    'v IS NULL': 'CAST(v IS NULL AS VARCHAR)',
};

const names = Object.keys(EXPRS);
console.log('--- reading the column as JSON ---');
console.log('case'.padEnd(26) + names.map((n) => n.padEnd(22)).join(''));
console.log('-'.repeat(26 + names.length * 22));

for (const [label, json] of CASES) {
    writeFileSync(FILE, json);
    const cells = [];
    for (const n of names) {
        let out;
        try {
            const sql = `SELECT ${EXPRS[n]}::VARCHAR FROM read_json('${FILE}',`
                + ` columns={'v':'JSON'}, format='newline_delimited')`;
            const rows = await (await conn.run(sql)).getRowsJson();
            out = rows.length === 0 ? '<no rows>' : (rows[0][0] ?? 'NULL');
        } catch (e) { out = `ERR:${e.message.slice(0, 16)}`; }
        cells.push(String(out).slice(0, 20).padEnd(22));
    }
    console.log(label.padEnd(26) + cells.join(''));
}

// Does reading as JSON cost more than VARCHAR? The whole point of read_json is speed.
console.log('\n--- cost: JSON vs VARCHAR raw read (200k rows, 12 cols) ---');
const N = 200_000;
const rows = [];
for (let i = 0; i < N; i++) {
    rows.push(JSON.stringify({
        a: `k-${i}`, b: i, c: i / 7, d: i % 2 === 0, e: `host-${i % 500}`,
        f: i * 3, g: `${i}`, h: i % 128, i: i % 32000, j: `label ${i}`,
        k: i % 5, l: i % 2 === 1,
    }));
}
writeFileSync(FILE, rows.join('\n'));
const cols = (t) => `{${'abcdefghijkl'.split('').map((c) => `'${c}':'${t}'`).join(', ')}}`;
const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };

for (const t of ['VARCHAR', 'JSON']) {
    const runs = [];
    for (let i = 0; i < 5; i++) {
        const s = hr();
        await conn.run(`CREATE OR REPLACE TABLE raw_${t} AS SELECT * FROM`
            + ` read_json('${FILE}', columns=${cols(t)}, format='newline_delimited')`);
        runs.push(hr() - s);
    }
    console.log(`  read as ${t.padEnd(8)} ${median(runs).toFixed(0).padStart(5)} ms  [${runs.map((r) => r.toFixed(0)).join(' ')}]`);
}

// and the cost of the accessors we would then need on every column
for (const [label, expr] of [['bare col', 'a'], ["->> '$'", "(a ->> '$')"], ['json_type', 'json_type(a)']]) {
    const runs = [];
    for (let i = 0; i < 5; i++) {
        const s = hr();
        await conn.run(`CREATE OR REPLACE TABLE acc AS SELECT ${expr} AS x FROM raw_JSON`);
        runs.push(hr() - s);
    }
    console.log(`  accessor ${label.padEnd(12)} ${median(runs).toFixed(0).padStart(5)} ms`);
}
