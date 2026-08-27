// Cross-check every coercion expression against LIVE data-mate, through the real
// untyped-read path (value arrives as VARCHAR, exactly as read_json delivers it).
// Anything that disagrees is either a bug in my SQL or a divergence to document.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { coerceExpr } from '@terascope/data-mate/dist/src/duck-frame/coercion-sql.js';

const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}conv.json`;
const conn = await (await DuckDBInstance.create(':memory:')).connect();

const TYPES = ['Byte', 'Short', 'Integer', 'Long', 'Float', 'Double', 'Number', 'Boolean', 'Keyword', 'Text'];

const INPUTS = [
    12, '12', '12.7', 12.7, -3, '-3', 0, '0',
    '1e3', '-1e3', '1e-3', '0x10', '0b11', '0o17', '1,000', '1_000',
    '2e21', 1e21, 'not-a-number', '', ' ', null,
    true, false, 'true', 'false', 'yes', 'no',
    'Infinity', '-Infinity', 'NaN',
    999, 99999, 9007199254740993, '9007199254740993',
    127, -128, 32767, -32768,
];

function dm(type, value) {
    try {
        const f = DataFrame.fromJSON({ version: 1, fields: { v: { type } } }, [{ v: value }]);
        const out = f.getColumnOrThrow('v').vector.toJSON()[0];
        return out === undefined || out === null ? 'NULL' : String(out);
    } catch { return 'FAIL'; }
}

async function ddb(type, value) {
    // go through read_json untyped, so the value is a VARCHAR like the real path
    writeFileSync(FILE, JSON.stringify({ v: value }));
    const expr = coerceExpr({ type }, 'v');
    try {
        const sql = `SELECT (${expr})::VARCHAR FROM read_json('${FILE}', columns={'v':'VARCHAR'}, format='newline_delimited')`;
        const got = (await (await conn.run(sql)).getRowsJson())[0][0];
        return got == null ? 'NULL' : String(got);
    } catch (e) { return `ERR:${e.message.slice(0, 24)}`; }
}

const show = (v) => (v === null ? 'null' : (typeof v === 'string' ? `'${v}'` : String(v)));
// normalise rendering only: 999.0 vs 999, inf vs Infinity are the same value
const norm = (s) => {
    if (s === 'inf') return 'Infinity';
    if (s === '-inf') return '-Infinity';
    if (/^-?\d+\.0+$/.test(s)) return s.replace(/\.0+$/, '');
    return s;
};
let agree = 0; let disagree = 0;
const problems = [];

for (const type of TYPES) {
    const rows = [];
    for (const input of INPUTS) {
        const a = dm(type, input);
        const b = await ddb(type, input);
        // dm FAIL <-> our NULL is agreement: strict mode turns that NULL into a raise
        const ok = norm(a) === norm(b) || (a === 'FAIL' && b === 'NULL') || (a === 'NULL' && b === 'NULL');
        if (ok) agree++; else { disagree++; problems.push({ type, input, dm: a, ddb: b }); }
        rows.push(`${ok ? ' ' : '!'}${show(input)}=${b}`);
    }
    console.log(`${type.padEnd(9)} ${rows.filter((r) => r.startsWith('!')).join('  ') || 'all agree'}`);
}

console.log(`\nagree ${agree}  disagree ${disagree}  (${TYPES.length} types x ${INPUTS.length} inputs)`);
if (problems.length) {
    console.log('\n--- disagreements ---');
    for (const p of problems) console.log(`  ${p.type.padEnd(8)} ${show(p.input).padEnd(20)} dm=${p.dm.padEnd(22)} ours=${p.ddb}`);
}
