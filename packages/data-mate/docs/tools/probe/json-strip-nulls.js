/**
 * **Can DuckDB omit null keys from JSON, and what does it cost?**
 *
 * This is the one export divergence that is not a simple per-column expression. spaces defaults
 * `remove_null_fields` to true (`create-execution-plan.ts:94`), so the real output OMITS null
 * fields, while `to_json` emits `"field": null` for every one - which makes every record with a
 * nullable field differ.
 *
 * Dates and big integers can be corrected with a cheap SQL expression before export. If null
 * stripping can be too, DuckDB can write the file itself and nothing needs post-processing.
 *
 * Run: node packages/data-mate/docs/tools/probe/json-strip-nulls.js
 *      ROWS=1000000 node .../json-strip-nulls.js
*/
import { duckdb, since, rate, heading, note } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();

const ROWS = Number(process.env.ROWS || 500_000);
const instance = await DuckDBInstance.create(':memory:');
const conn = await instance.connect();

// a result shaped like the comparison corpus: two always/half-null columns among real ones
await conn.run(`
    CREATE TABLE t AS
    SELECT
        ('key-' || i) AS _key,
        ('name ' || (i % 1000)) AS name,
        (i % 1000)::BIGINT AS count,
        (i % 2 = 0) AS active,
        NULL::VARCHAR AS subnet,
        CASE WHEN i % 2 = 0 THEN NULL ELSE '2027-01-01' END AS expires,
        ['a','b'] AS tags,
        {'source': 'api', 'retries': i % 5} AS metadata
    FROM range(${ROWS}) tbl(i)
`);

heading('Does DuckDB have a null-stripping JSON function?');

const candidates = [
    ['json_strip_nulls (Postgres style)', "json_strip_nulls(to_json({'a': 1, 'b': NULL}))"],
    ['json_merge_patch with empty patch', "json_merge_patch(to_json({'a': 1, 'b': NULL}), '{}')"],
    ['json_merge_patch onto itself', "json_merge_patch('{}', to_json({'a': 1, 'b': NULL}))"],
    ['to_json of a filtered MAP', `to_json(map_from_entries(list_filter(
        [{'k': 'a', 'v': to_json(1)}, {'k': 'b', 'v': to_json(NULL)}],
        e -> e.v::VARCHAR != 'null'
    )))`],
];

for (const [label, sql] of candidates) {
    try {
        const result = await conn.run(`SELECT (${sql})::VARCHAR AS v`);
        const [{ v }] = await result.getRowObjectsJson();
        const ok = !String(v).includes('null');
        note(`${label.padEnd(38)} ${String(v).padEnd(30)} ${ok ? '<- STRIPS NULLS' : ''}`);
    } catch (err) {
        note(`${label.padEnd(38)} unavailable: ${err.message.split('\n')[0].slice(0, 46)}`);
    }
}

// ---------------------------------------------------------------- cost, at scale
heading(`Cost over ${ROWS.toLocaleString()} rows`);

async function timeIt(label, sql) {
    try {
        const start = process.hrtime.bigint();
        const result = await conn.run(sql);
        await result.getRowsJson();
        const ms = since(start);
        note(`${label.padEnd(40)}${`${ms.toFixed(0)} ms`.padStart(9)}  ${rate(ROWS, ms).padStart(14)}`);
        return ms;
    } catch (err) {
        note(`${label.padEnd(40)} FAILED: ${err.message.split('\n')[0].slice(0, 50)}`);
        return null;
    }
}

/**
 * `sum(strlen(...))`, NOT `count(*)`.
 *
 * A first attempt used `count(*)` over the projection and reported 500,000 rows in 0 ms at 1.5
 * BILLION rows/s - because the optimiser threw the projection away entirely. A count does not
 * need the JSON, so the JSON was never built. Summing the string length forces every value to
 * be produced, and only then is the number real.
*/
const baseline = await timeIt(
    'to_json, nulls INCLUDED (the baseline)',
    'SELECT sum(strlen(to_json(t)::VARCHAR)) FROM t'
);

await timeIt(
    'json_merge_patch strip',
    "SELECT sum(strlen(json_merge_patch('{}', to_json(t))::VARCHAR)) FROM t"
);

/**
 * The generated alternative: build the object from only the columns that are non-null on THIS
 * row, using `json_object` over a filtered entry list. This is what the export layer would
 * generate from the DataTypeConfig if no built-in works.
*/
await timeIt(
    'filtered MAP -> json',
    `SELECT sum(strlen(
        to_json(map_from_entries(list_filter([
            {'k': '_key',    'v': to_json("_key")},
            {'k': 'name',    'v': to_json("name")},
            {'k': 'count',   'v': to_json("count")},
            {'k': 'active',  'v': to_json("active")},
            {'k': 'subnet',  'v': to_json("subnet")},
            {'k': 'expires', 'v': to_json("expires")},
            {'k': 'tags',    'v': to_json("tags")},
            {'k': 'metadata','v': to_json("metadata")}
        ], e -> e.v::VARCHAR != 'null')))::VARCHAR
    )) FROM t`
);

// and the shape the export layer will really emit: dates fixed, big ints stringified, nulls gone
await timeIt(
    'full export projection (dates+bigints+strip)',
    `SELECT sum(strlen(json_merge_patch('{}', to_json({
        '_key': "_key",
        'name': "name",
        'count': CASE WHEN abs("count") > 9007199254740991
            THEN to_json("count"::VARCHAR) ELSE to_json("count") END,
        'active': "active",
        'subnet': "subnet",
        'expires': "expires",
        'tags': "tags",
        'metadata': "metadata"
    }))::VARCHAR)) FROM t`
);

if (baseline != null) {
    heading('Verdict');
    note('If a strip costs a small multiple of the baseline it stays worthwhile, because the');
    note('baseline itself is far below what building JS objects costs.');
}

conn.disconnectSync();
instance.closeSync();
