// Does read_json(columns=...) agree with DataType-driven coercion on MESSY input?
//
// The speed result is only usable if the semantics match, because the DataType field
// config is supposed to be authoritative. This probes one value at a time - data-mate
// throws on the first bad value in a batch and would otherwise mask every later case.

import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';

const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}probe.json`;
const instance = await DuckDBInstance.create(':memory:');
const conn = await instance.connect();

// FieldType -> DuckDB type, the mapping the ingest path would use
const MAP = {
    Keyword: 'VARCHAR', Text: 'VARCHAR', IP: 'VARCHAR', Hostname: 'VARCHAR',
    Integer: 'BIGINT', Long: 'BIGINT', Double: 'DOUBLE', Float: 'FLOAT',
    Byte: 'TINYINT', Short: 'SMALLINT', Boolean: 'BOOLEAN', Date: 'TIMESTAMP',
    GeoPoint: 'STRUCT(lat DOUBLE, lon DOUBLE)',
};

// [FieldType, raw JSON value, why it matters]
const CASES = [
    ['Integer', 12, 'baseline'],
    ['Integer', null, 'explicit null'],
    ['Integer', '12', 'numeric string'],
    ['Integer', '12.7', 'float string into int field'],
    ['Integer', 12.7, 'float into int field (dm truncates)'],
    ['Integer', '1e3', 'D4: exponent notation'],
    ['Integer', '0x10', 'D4: hex string'],
    ['Integer', '1,000', 'D4: separator - dm accepts'],
    ['Integer', '1_000', 'D4: underscore separator'],
    ['Integer', '2e21', 'D4: beyond safe integer - dm throws'],
    ['Integer', 'not-a-number', 'garbage'],
    ['Integer', '', 'empty string'],
    ['Integer', true, 'boolean into numeric'],
    ['Byte', 999, 'out of Byte range (dm throws)'],
    ['Byte', '1e3', 'D4: out of range once fully parsed'],
    ['Short', 99999, 'out of Short range'],
    ['Long', '9007199254740993', 'above 2^53, precision matters'],
    ['Double', 'Infinity', 'non-finite string'],
    ['Double', 1e400, 'overflows to Infinity in JSON'],
    ['Float', '1.5', 'numeric string into float'],
    ['Boolean', 'true', 'string bool'],
    ['Boolean', 1, 'numeric bool'],
    ['Boolean', 'yes', 'truthy word'],
    ['Keyword', 123, 'number into keyword'],
    ['Keyword', '', 'empty string'],
    ['Keyword', null, 'null keyword'],
    ['Date', '2026-01-02T03:04:05.000Z', 'ISO baseline'],
    ['Date', '1710028800000', 'D5: epoch millis as string'],
    ['Date', 1710028800000, 'epoch millis as number'],
    ['Date', '0', 'D5: bare zero - dm gives year 2000'],
    ['Date', '2026-01-02', 'date only'],
    ['Date', '01/02/2026', 'loose US format'],
    ['Date', 'not-a-date', 'garbage date'],
    ['IP', '1.2.3.4', 'baseline ip'],
    ['IP', '01.02.03.04', 'leading zeros - dm rejects'],
    ['IP', '::1', 'ipv6 loopback'],
    ['IP', 'not-an-ip', 'garbage ip'],
    ['GeoPoint', { lat: 12, lon: 13 }, 'object form'],
    ['GeoPoint', '12,13', 'string form - dm accepts'],
    ['GeoPoint', [13, 12], 'lon,lat tuple form'],
];

const show = (v) => {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
};

async function dmRun(type, value) {
    try {
        const f = DataFrame.fromJSON({ version: 1, fields: { v: { type } } }, [{ v: value }]);
        return { ok: true, out: show(f.getColumnOrThrow('v').vector.toJSON()[0]) };
    } catch (e) { return { ok: false, out: `THROWS: ${e.message.split('\n')[0].slice(0, 46)}` }; }
}

async function ddbRun(type, value) {
    writeFileSync(FILE, JSON.stringify({ v: value }));
    try {
        const r = await conn.run(
            `SELECT v FROM read_json('${FILE}', columns = {'v': '${MAP[type]}'}, format = 'newline_delimited')`
        );
        const rows = await r.getRowsJson();
        return { ok: true, out: show(rows[0]?.[0] ?? null) };
    } catch (e) { return { ok: false, out: `THROWS: ${e.message.split('\n')[0].slice(0, 46)}` }; }
}

console.log('FieldType  input                       data-mate                  read_json(explicit)        verdict');
console.log('-'.repeat(122));

const tally = { agree: 0, silentDiff: 0, dmThrowsDdbNulls: 0, dmAcceptsDdbNulls: 0, other: 0 };
const notable = [];

for (const [type, value, why] of CASES) {
    const dm = await dmRun(type, value);
    const ddb = await ddbRun(type, value);

    let verdict;
    const dmNil = dm.ok && (dm.out === 'null' || dm.out === 'undefined');
    const ddbNil = ddb.ok && (ddb.out === 'null' || ddb.out === 'undefined');

    if (dm.ok && ddb.ok && dm.out === ddb.out) { verdict = 'agree'; tally.agree++; } else if (!dm.ok && ddbNil) { verdict = 'DM THROWS / ddb nulls'; tally.dmThrowsDdbNulls++; notable.push([type, value, why, dm.out, ddb.out, verdict]); } else if (dm.ok && !dmNil && ddbNil) { verdict = 'DM VALUE / ddb nulls'; tally.dmAcceptsDdbNulls++; notable.push([type, value, why, dm.out, ddb.out, verdict]); } else if (dm.ok && ddb.ok) { verdict = '** SILENT DIFF **'; tally.silentDiff++; notable.push([type, value, why, dm.out, ddb.out, verdict]); } else { verdict = 'other'; tally.other++; notable.push([type, value, why, dm.out, ddb.out, verdict]); }

    console.log(`${type.padEnd(10)} ${show(value).slice(0, 26).padEnd(27)} ${dm.out.slice(0, 26).padEnd(26)} ${ddb.out.slice(0, 26).padEnd(26)} ${verdict}`);
}

console.log('-'.repeat(122));
console.log(`\ntotal ${CASES.length}:  agree ${tally.agree}  |  silent-diff ${tally.silentDiff}`
    + `  |  dm-throws/ddb-nulls ${tally.dmThrowsDdbNulls}  |  dm-value/ddb-nulls ${tally.dmAcceptsDdbNulls}  |  other ${tally.other}`);

console.log('\n--- the ones that matter ---');
for (const [type, value, why, a, b, v] of notable) {
    console.log(`  [${v}] ${type} ${show(value)}\n      dm=${a}\n      ddb=${b}\n      why: ${why}`);
}
