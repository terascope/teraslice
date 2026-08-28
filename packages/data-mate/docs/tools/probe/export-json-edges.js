/**
 * The two export-parity questions the first probe could not answer.
 *
 * 1. **`bigIntToJSON` above MAX_SAFE_INTEGER.** `DataFrame` switches to a STRING there; DuckDB
 *    emitted a full number. The comparison corpus keeps `Long` small, so it never hit this.
 * 2. **Nulls and key presence.** The first probe normalised a missing key to `null` before
 *    comparing, which would hide `DataFrame` omitting a key where DuckDB emits `"x": null`.
 *
 * Run: node packages/data-mate/docs/tools/probe/export-json-edges.js
*/
import { dataMate, heading, note } from '../lib/duck.mjs';

const { DataFrame } = await dataMate();
const { DuckFrame, closeDuckDatabase } = await import(
    new URL('../../../dist/src/duck-frame/DuckFrame.js', import.meta.url).href
);

// ---------------------------------------------------------------- 1. big integers
heading('1. Long / Integer above MAX_SAFE_INTEGER');

const BIG_CONFIG = {
    version: 1,
    fields: {
        small: { type: 'Long' },
        atLimit: { type: 'Long' },
        beyond: { type: 'Long' },
        huge: { type: 'Long' },
    },
};

const BIG_RECORDS = [{
    small: 42,
    atLimit: Number.MAX_SAFE_INTEGER,
    beyond: '9007199254740993',
    huge: '123456789012345678901',
}];

const dfBig = DataFrame.fromJSON(BIG_CONFIG, BIG_RECORDS);
const dfJson = JSON.parse(JSON.stringify(dfBig.toJSON()[0]));

const duckBig = await DuckFrame.fromRecords(BIG_CONFIG, BIG_RECORDS, {});
const [[nativeBig]] = await duckBig.query(
    `SELECT to_json(t)::VARCHAR FROM ${duckBig.from} AS t`
);
const duckJson = JSON.parse(String(nativeBig));

for (const field of Object.keys(BIG_CONFIG.fields)) {
    const want = JSON.stringify(dfJson[field]);
    const got = JSON.stringify(duckJson[field]);
    note(`${field.padEnd(10)} DataFrame ${String(want).padEnd(26)} DuckDB ${got}`
        + `   ${want === got ? 'match' : '<-- DIFFERS'}`);
}
note('');
note('`bigIntToJSON` yields a NUMBER when it fits and a STRING above MAX_SAFE_INTEGER,');
note('because JSON.parse would silently round the number form.');

await duckBig.destroy();

// ---------------------------------------------------------------- 2. nulls and key presence
heading('2. Nulls, empty arrays, and whether the KEY is present at all');

const NULL_CONFIG = {
    version: 1,
    fields: {
        _key: { type: 'Keyword' },
        alwaysNull: { type: 'Keyword' },
        sometimesNull: { type: 'Integer' },
        emptyArray: { type: 'Keyword', array: true },
        nullArray: { type: 'Keyword', array: true },
        arrayWithNulls: { type: 'Keyword', array: true },
        nullObject: { type: 'Object' },
        'nullObject.inner': { type: 'Keyword' },
    },
};

const NULL_RECORDS = [{
    _key: 'a',
    alwaysNull: null,
    sometimesNull: null,
    emptyArray: [],
    nullArray: null,
    arrayWithNulls: ['x', null, 'y'],
    nullObject: null,
}];

const dfNull = DataFrame.fromJSON(NULL_CONFIG, NULL_RECORDS);
const dfRow = JSON.parse(JSON.stringify(dfNull.toJSON()[0]));

const duckNull = await DuckFrame.fromRecords(NULL_CONFIG, NULL_RECORDS, {});
const [[nativeNull]] = await duckNull.query(
    `SELECT to_json(t)::VARCHAR FROM ${duckNull.from} AS t`
);
const duckRow = JSON.parse(String(nativeNull));

note(`DataFrame keys: ${Object.keys(dfRow).join(', ') || '(none)'}`);
note(`DuckDB    keys: ${Object.keys(duckRow).join(', ')}`);
note('');

const allKeys = [...new Set([...Object.keys(dfRow), ...Object.keys(duckRow)])];
for (const key of allKeys) {
    const inDf = Object.hasOwn(dfRow, key);
    const inDuck = Object.hasOwn(duckRow, key);
    const want = inDf ? JSON.stringify(dfRow[key]) : '(key absent)';
    const got = inDuck ? JSON.stringify(duckRow[key]) : '(key absent)';
    note(`${key.padEnd(16)} DataFrame ${String(want).padEnd(20)} DuckDB ${String(got).padEnd(20)}`
        + `   ${want === got ? 'match' : '<-- DIFFERS'}`);
}

await duckNull.destroy();
await closeDuckDatabase();
