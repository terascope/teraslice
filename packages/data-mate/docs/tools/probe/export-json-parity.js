/**
 * **Does DuckDB's own JSON export match what `DataFrame` produces?**
 *
 * This has to be answered BEFORE any "let DuckDB write the file" optimisation is believed,
 * because the output format is a public contract. `DataFrame` has per-type JSON conventions -
 * `DateVector.toJSONCompatibleValue` is `toISO8601`, `BigIntVector`'s is `bigIntToJSON` (a number
 * when it fits, a string above MAX_SAFE_INTEGER) - and DuckDB knows none of them. A TIMESTAMP
 * rendered by `to_json` is SQL-shaped, not ISO8601.
 *
 * So: build the same records in both engines, take `DataFrame.toJSON()` as the reference, take
 * DuckDB's `to_json(t)`, and diff them field by field. Every divergence found here is either a
 * SQL expression that has to be applied before export, or a type that cannot be exported by
 * DuckDB at all.
 *
 * Run: node packages/data-mate/docs/tools/probe/export-json-parity.js
*/
import { duckdb, dataMate, heading, note } from '../lib/duck.mjs';

const { DataFrame } = await dataMate();
const { DuckDBInstance } = await duckdb();

const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const RECORDS = makeRecords(3);

/**
 * The reference is NOT `toJSON()` with defaults - it is what **spaces** asks for.
 *
 * `qpl-engine/src/v3/execute/run.ts:174` builds these from the plan, and
 * `create-execution-plan.ts:94` defaults `remove_null_fields` to **true**, flipped off only by
 * the `@preserveNullFields` directive. So by default the real output **omits null fields
 * entirely** and drops empty objects - while DuckDB's `to_json` emits `"field": null` for every
 * one of them. Comparing against the library default would have measured the wrong contract.
*/
const SPACES_DEFAULTS = {
    useNullForUndefined: false,
    skipNilValues: true,
    skipEmptyObjects: true,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

/** What `@preserveNullFields` asks for instead. */
const PRESERVE_NULLS = {
    useNullForUndefined: true,
    skipNilValues: false,
    skipEmptyObjects: false,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

const frame = DataFrame.fromJSON(CONFIG, RECORDS);
const reference = frame.toJSON(SPACES_DEFAULTS).map((row) => JSON.parse(JSON.stringify(row)));
const preserved = frame.toJSON(PRESERVE_NULLS).map((row) => JSON.parse(JSON.stringify(row)));

// ------------------------------------------------ what DuckDB emits on its own
const { DuckFrame, closeDuckDatabase } = await import(
    new URL('../../../dist/src/duck-frame/DuckFrame.js', import.meta.url).href
);

const duck = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
const rows = await duck.query(`SELECT to_json(t)::VARCHAR FROM ${duck.from} AS t`);
const native = rows.map(([json]) => JSON.parse(String(json)));

// ------------------------------------------------ key presence, the biggest divergence
heading('Key presence: what spaces actually emits');

const refKeys = Object.keys(reference[0]);
const preservedKeys = Object.keys(preserved[0]);
const duckKeys = Object.keys(native[0]);

note(`spaces default (remove_null_fields=true): ${refKeys.length} keys on record 0`);
note(`with @preserveNullFields:                 ${preservedKeys.length} keys`);
note(`DuckDB to_json:                           ${duckKeys.length} keys`);

const omitted = duckKeys.filter((key) => !refKeys.includes(key));
if (omitted.length) {
    note('');
    note(`DuckDB emits ${omitted.length} key(s) that spaces OMITS by default: ${omitted.join(', ')}`);
    note('Every null field is one of these, so by default EVERY record would differ.');
}

// ------------------------------------------------ diff, per field
heading('DuckDB to_json() vs DataFrame.toJSON(), values only');

const fields = Object.keys(CONFIG.fields).filter((f) => !f.includes('.'));
const divergent = [];

for (const field of fields) {
    const type = CONFIG.fields[field].type + (CONFIG.fields[field].array ? '[]' : '');
    let differs = false;
    let example = '';

    for (let i = 0; i < reference.length; i++) {
        const want = JSON.stringify(reference[i][field] ?? null);
        const got = JSON.stringify(native[i][field] ?? null);
        if (want !== got) {
            differs = true;
            example = `DataFrame ${want}   DuckDB ${got}`;
            break;
        }
    }

    if (differs) {
        divergent.push({ field, type, example });
        note(`DIFFERS  ${field.padEnd(14)} ${type.padEnd(12)} ${example}`);
    }
}

if (!divergent.length) {
    note('no divergences - DuckDB\'s native JSON matches DataFrame for every field');
} else {
    heading(`${divergent.length} of ${fields.length} fields DIVERGE`);
    note('Each needs a SQL expression applied before export, or must not be exported natively.');
    for (const { field, type } of divergent) note(`  ${field} (${type})`);
}

// ------------------------------------------------ can the divergences be fixed in SQL?
heading('Can SQL produce the right shape?');

const conn = await (await DuckDBInstance.create(':memory:')).connect();
const check = async (label, sql) => {
    try {
        const result = await conn.run(`SELECT ${sql} AS v`);
        const [{ v }] = await result.getRowObjectsJson();
        note(`${label.padEnd(34)} ${String(v)}`);
    } catch (err) {
        note(`${label.padEnd(34)} ERR ${err.message.split('\n')[0].slice(0, 60)}`);
    }
};

await check('TIMESTAMP native', "to_json(TIMESTAMP '2026-08-14 01:02:03.456')");
await check('TIMESTAMP -> ISO8601', "strftime(TIMESTAMP '2026-08-14 01:02:03.456', '%Y-%m-%dT%H:%M:%S.%gZ')");
await check('BIGINT native', 'to_json(9007199254740993::BIGINT)');
await check('HUGEINT native', 'to_json(170141183460469231731687303715884105727::HUGEINT)');
await check('struct native', "to_json({'lat': 1.5, 'lon': 2.5})");
await check('list native', "to_json(['a', 'b'])");

conn.disconnectSync();
await duck.destroy();
await closeDuckDatabase();
