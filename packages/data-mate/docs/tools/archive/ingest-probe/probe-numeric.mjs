// What does DuckDB actually do with the numeric string forms data-mate accepts?
// Needed before writing the coercion expressions: the D4 fix made data-mate parse
// the WHOLE value ('1e3'->1000, '0x10'->16, '1,000'->1000), and I must know which
// of those DuckDB's casts handle natively vs which need help.

import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';

const conn = await (await DuckDBInstance.create(':memory:')).connect();
const q = async (sql) => {
    try { return String((await (await conn.run(sql)).getRowsJson())[0][0]); } catch (e) { return `ERR:${e.message.slice(0, 28)}`; }
};

const STRIP = (r) => `replace(replace(${r}, ',', ''), '_', '')`;

// candidate expressions for FieldType.Integer (target BIGINT)
const CANDIDATES = {
    'TRY_CAST->BIGINT            ': (r) => `TRY_CAST(${r} AS BIGINT)`,
    'TRY_CAST->DOUBLE            ': (r) => `TRY_CAST(${r} AS DOUBLE)`,
    'strip+TRY_CAST->DOUBLE      ': (r) => `TRY_CAST(${STRIP(r)} AS DOUBLE)`,
    'strip+TRUNC(DOUBLE)->BIGINT ': (r) => `TRY_CAST(TRUNC(TRY_CAST(${STRIP(r)} AS DOUBLE)) AS BIGINT)`,
    'coalesce(BIGINT, TRUNC DBL) ': (r) => `COALESCE(TRY_CAST(${STRIP(r)} AS BIGINT), TRY_CAST(TRUNC(TRY_CAST(${STRIP(r)} AS DOUBLE)) AS BIGINT))`,
};

// [raw json literal, data-mate FieldType.Integer expectation]
const CASES = [
    ["'12'", 12], ["'12.7'", 12], ['12.7', 12], ["'1e3'", 1000], ["'-1e3'", -1000],
    ["'0x10'", 16], ["'0b11'", 3], ["'0o17'", 15], ["'1,000'", 1000], ["'1_000'", 1000],
    ["'2e21'", 'THROWS'], ["'not-a-number'", 'THROWS'], ["''", 'THROWS'],
];

// what data-mate really does, so the table is checked not assumed
function dm(type, value) {
    try {
        const f = DataFrame.fromJSON({ version: 1, fields: { v: { type } } }, [{ v: value }]);
        const out = f.getColumnOrThrow('v').vector.toJSON()[0];
        return out === undefined ? 'null' : String(out);
    } catch { return 'THROWS'; }
}
const raws = { "'12'": '12', "'12.7'": '12.7', '12.7': 12.7, "'1e3'": '1e3', "'-1e3'": '-1e3', "'0x10'": '0x10', "'0b11'": '0b11', "'0o17'": '0o17', "'1,000'": '1,000', "'1_000'": '1_000', "'2e21'": '2e21', "'not-a-number'": 'not-a-number', "''": '' };

const names = Object.keys(CANDIDATES);
console.log('=== FieldType.Integer ===');
console.log('input'.padEnd(16) + 'data-mate'.padEnd(12) + names.map((n) => n.trim().slice(0, 27).padEnd(29)).join(''));
console.log('-'.repeat(16 + 12 + names.length * 29));

const score = Object.fromEntries(names.map((n) => [n, 0]));
for (const [lit, expected] of CASES) {
    const actualDm = dm('Integer', raws[lit]);
    const cells = [];
    for (const n of names) {
        const got = await q(`SELECT ${CANDIDATES[n](lit)}`);
        const norm = got.startsWith('ERR:') ? 'THROWS' : (got === 'null' ? 'null' : got);
        // a coercion FAILURE (null/throw) is the right answer when dm throws
        const ok = actualDm === 'THROWS' ? (norm === 'null' || norm === 'THROWS') : norm === actualDm;
        if (ok) score[n]++;
        cells.push(`${ok ? ' ' : '!'}${norm}`.slice(0, 27).padEnd(29));
    }
    console.log(lit.padEnd(16) + actualDm.padEnd(12) + cells.join(''));
}
console.log('-'.repeat(16 + 12 + names.length * 29));
console.log('score'.padEnd(28) + names.map((n) => `${score[n]}/${CASES.length}`.padEnd(29)).join(''));

// range enforcement: Byte/Short must reject out-of-range like data-mate does
console.log('\n=== range enforcement (Byte=TINYINT, Short=SMALLINT) ===');
const best = (r, t) => `TRY_CAST(TRUNC(TRY_CAST(${STRIP(r)} AS DOUBLE)) AS ${t})`;
for (const [lit, type, duck] of [["'1e3'", 'Byte', 'TINYINT'], ['999', 'Byte', 'TINYINT'], ["'1e5'", 'Short', 'SMALLINT'], ['99999', 'Short', 'SMALLINT'], ['100', 'Byte', 'TINYINT']]) {
    const got = await q(`SELECT ${best(lit, duck)}`);
    console.log(`  ${type} <- ${lit.padEnd(9)} dm=${dm(type, raws[lit] ?? Number(lit)).padEnd(9)} ours=${got}`);
}

// float/double forms
console.log('\n=== FieldType.Double ===');
for (const [lit, v] of [["'1e3'", '1e3'], ["'1e-3'", '1e-3'], ["'0x10'", '0x10'], ["'1,000'", '1,000'], ["'Infinity'", 'Infinity'], ["'-Infinity'", '-Infinity'], ["'NaN'", 'NaN']]) {
    const got = await q(`SELECT TRY_CAST(${STRIP(lit)} AS DOUBLE)`);
    console.log(`  Double <- ${lit.padEnd(12)} dm=${dm('Double', v).padEnd(12)} ours=${got}`);
}

// boolean forms
console.log('\n=== FieldType.Boolean ===');
for (const [lit, v] of [["'true'", 'true'], ["'yes'", 'yes'], ['1', 1], ['0', 0], ["'no'", 'no'], ["'garbage'", 'garbage']]) {
    console.log(`  Boolean <- ${lit.padEnd(11)} dm=${dm('Boolean', v).padEnd(9)} TRY_CAST=${await q(`SELECT TRY_CAST(${lit} AS BOOLEAN)`)}`);
}
