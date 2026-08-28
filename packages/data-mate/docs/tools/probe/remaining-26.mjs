/**
 * What is actually in the way of the 26 unpromoted functions?
 *
 * Written after four of the "genuine walls" in `HANDOFF.md` turned out to be walls in
 * `validator`'s implementation rather than in the one `core-utils` actually calls. This probes the
 * DuckDB side of every remaining claim rather than reasoning about it:
 *
 * 1. `to_json` against `JSON.stringify`, per column type - is `toJSON` just a cast?
 * 2. Shannon entropy as a list expression - is per-character aggregation really impossible?
 * 3. `expm1`/`log1p` - how far off is `exp(x)-1`, and does a piecewise form recover it?
 * 4. `strftime`/`strptime` - which of `toISO8601` and the epoch formats are one call?
 * 5. Which EXTENSIONS exist, core and community, and what would each unlock?
 *
 *     node packages/data-mate/docs/tools/probe/remaining-26.mjs
 */
import { open } from '../lib/duck.mjs';

const { connection: conn, close } = await open();

const lit = (v) => `'${String(v).replaceAll("'", "''")}'`;

async function one(expression) {
    const reader = await conn.run(`SELECT ${expression} AS v`);
    return (await reader.getRowsJson())[0][0];
}

async function tryOne(expression) {
    try {
        return { ok: true, value: await one(expression) };
    } catch (err) {
        return { ok: false, value: String(err.message).split('\n')[0] };
    }
}

function report(title, rows) {
    console.log(`\n=== ${title} ===`);
    for (const row of rows) {
        console.log(`${row.match ? '  ' : '!!'} ${String(row.label).padEnd(40)} js=${String(row.js).slice(0, 30).padEnd(32)} sql=${String(row.sql).slice(0, 34)}`);
    }
    const bad = rows.filter((r) => !r.match).length;
    console.log(`   ${bad === 0 ? 'NO DIVERGENCES' : `${bad} of ${rows.length} DIVERGE`}`);
}

/* ------------------------------------------------------------ 1. toJSON */

const JSON_CASES = [
    ['VARCHAR', lit('abc'), 'abc'],
    ['VARCHAR', lit(''), ''],
    ['VARCHAR', lit('with "quotes"'), 'with "quotes"'],
    ['VARCHAR', lit('tab\there'), 'tab\there'],
    ['VARCHAR', lit('héllo 👍'), 'héllo 👍'],
    ['VARCHAR', lit('back\\slash'), 'back\\slash'],
    ['BIGINT', '42', 42],
    ['DOUBLE', '1.5', 1.5],
    ['DOUBLE', '0.1', 0.1],
    ['DOUBLE', '1e21', 1e21],
    ['DOUBLE', '-0.0', -0.0],
    ['BOOLEAN', 'true', true],
    ['BOOLEAN', 'false', false],
];

const jsonRows = [];
for (const [type, sqlValue, jsValue] of JSON_CASES) {
    const js = JSON.stringify(jsValue);
    const sql = await tryOne(`CAST(to_json(CAST(${sqlValue} AS ${type})) AS VARCHAR)`);
    jsonRows.push({
        label: `to_json ${type} ${JSON.stringify(jsValue).slice(0, 16)}`,
        js,
        sql: sql.value,
        match: sql.ok && sql.value === js,
    });
}
report('toJSON - to_json vs JSON.stringify, by column type', jsonRows);

console.log('   a TIMESTAMP:', JSON.stringify(await tryOne(
    "CAST(to_json(CAST('2026-01-02T03:04:05.678Z' AS TIMESTAMP)) AS VARCHAR)"
)), 'vs js', JSON.stringify(JSON.stringify(new Date('2026-01-02T03:04:05.678Z'))));
console.log('   a STRUCT:  ', JSON.stringify(await tryOne(
    "CAST(to_json({'b': 2, 'a': 1}) AS VARCHAR)"
)), 'vs js', JSON.stringify(JSON.stringify({ b: 2, a: 1 })));
console.log('   a LIST:    ', JSON.stringify(await tryOne(
    "CAST(to_json([1, 2, 3]) AS VARCHAR)"
)), 'vs js', JSON.stringify(JSON.stringify([1, 2, 3])));

/* ------------------------------------------------------------ 2. entropy */

function shannon(input) {
    let sum = 0;
    const len = input.length;
    const dict = Object.create(null);
    for (const char of input) dict[char] = (dict[char] ?? 0) + 1;
    for (const num of Object.values(dict)) {
        const p = num / len;
        sum -= (p * Math.log(p)) / Math.log(2);
    }
    return sum;
}

/**
 * Shannon entropy with no aggregate at all: split to a list, count each DISTINCT character with
 * `list_filter`, then fold. `len(v)` is the divisor because the JavaScript uses `input.length`,
 * which is UTF-16 CODE UNITS - so astral input needs a guard, not a different formula.
*/
function entropySql(value) {
    const chars = `string_split(${value}, '')`;
    const counts = `list_transform(list_distinct(${chars}),`
        + ` lambda c : len(list_filter(${chars}, lambda x : x = c)))`;
    const total = `len(${chars})`;
    const terms = `list_transform(${counts},`
        + ` lambda n : -((n / ${total}) * ln(n / ${total}) / ln(2)))`;
    return `CASE WHEN ${total} = 0 THEN 0`
        + ` ELSE list_reduce(${terms}, lambda a, b : a + b) END`;
}

const entropyRows = [];
for (const input of ['hello', 'aaaa', 'abcdefg', '', 'a', 'aabb', 'The quick brown fox', '1234567890', 'héllo']) {
    const js = shannon(input);
    const sql = await tryOne(entropySql(lit(input)));
    entropyRows.push({
        label: `entropy ${JSON.stringify(input).slice(0, 20)}`,
        js,
        sql: sql.value,
        // a float fold: compare to a few ULP, which is what `approximate` is for
        match: sql.ok && Math.abs(Number(sql.value) - js) <= Math.max(1e-12, Math.abs(js) * 1e-12),
    });
}
report('entropy - shannon as a pure list expression', entropyRows);

/* ------------------------------------------------------------ 3. expm1 / log1p */

const ulp = (a, b) => (a === b ? 0 : Math.abs(a - b) / Math.max(Number.MIN_VALUE, Math.abs(b)));

const expRows = [];
for (const x of [1e-17, 1e-12, 1e-9, 1e-7, 1e-5, 1e-3, 0.1, 0.5, 1, 5, -1e-9, -1e-5, -0.5, -1]) {
    const js = Math.expm1(x);
    const naive = await tryOne(`exp(CAST(${x} AS DOUBLE)) - 1`);
    // the piecewise form: Taylor below the cancellation threshold, the plain form above it
    const piece = await tryOne(
        `CASE WHEN abs(CAST(${x} AS DOUBLE)) < 1e-5`
        + ` THEN ${x} + (${x} * ${x}) / 2 + (${x} * ${x} * ${x}) / 6`
        + ` + (${x} * ${x} * ${x} * ${x}) / 24`
        + ` ELSE exp(CAST(${x} AS DOUBLE)) - 1 END`
    );
    expRows.push({
        label: `expm1(${x}) naive`, js, sql: naive.value, match: naive.ok && ulp(Number(naive.value), js) < 1e-15,
    });
    expRows.push({
        label: `expm1(${x}) piecewise`, js, sql: piece.value, match: piece.ok && ulp(Number(piece.value), js) < 1e-15,
    });
}
report('expm1 - relative error under 1e-15 vs Math.expm1', expRows);

/* ------------------------------------------------------------ 4. date formats */

const dateRows = [];
const INSTANTS = [
    '2026-01-02T03:04:05.678Z', '1970-01-01T00:00:00.000Z',
    '2026-12-31T23:59:59.999Z', '1900-03-01T00:00:00.000Z',
];
for (const iso of INSTANTS) {
    const ts = `CAST(${lit(iso)} AS TIMESTAMP)`;
    const jsIso = new Date(iso).toISOString();
    const sqlIso = await tryOne(`strftime(${ts}, '%Y-%m-%dT%H:%M:%S.%gZ')`);
    dateRows.push({
        label: `toISO8601 ${iso.slice(0, 16)}`, js: jsIso, sql: sqlIso.value, match: sqlIso.ok && sqlIso.value === jsIso,
    });
    const jsSecs = Math.floor(new Date(iso).getTime() / 1000);
    const sqlSecs = await tryOne(`CAST(floor(epoch_ms(${ts}) / 1000) AS BIGINT)`);
    dateRows.push({
        label: `epoch seconds ${iso.slice(0, 16)}`, js: jsSecs, sql: sqlSecs.value, match: sqlSecs.ok && Number(sqlSecs.value) === jsSecs,
    });
}
report('formatDate - the three non-date-fns branches', dateRows);

console.log('   %g vs %f for millis:',
    JSON.stringify(await tryOne("strftime(CAST('2026-01-02T03:04:05.678Z' AS TIMESTAMP), '%Y-%m-%dT%H:%M:%S.%gZ')")),
    JSON.stringify(await tryOne("strftime(CAST('2026-01-02T03:04:05.678Z' AS TIMESTAMP), '%Y-%m-%dT%H:%M:%S.%fZ')")));

/* ------------------------------------------------------------ 5. extensions */

console.log('\n=== extensions: what is already here ===');
const exts = await conn.run(
    'SELECT extension_name, loaded, installed, install_mode FROM duckdb_extensions()'
    + " WHERE loaded OR installed ORDER BY extension_name"
);
for (const row of await exts.getRowsJson()) console.log('  ', row.join(' | '));

console.log('\n=== extensions: what a remaining function would need ===');
const CANDIDATES = [
    ['crypto', 'sha512/md4 digests - would unlock `encode` beyond md5/sha1/sha256'],
    ['icu', 'full timezone database - the setTimezone/toTimeZone group'],
    ['json', 'to_json / json_extract - toJSON, parseJSON, cast'],
];
for (const [name, why] of CANDIDATES) {
    const loaded = await tryOne(
        `(SELECT count(*) FROM duckdb_extensions() WHERE extension_name = ${lit(name)} AND loaded)`
    );
    console.log(`   ${name.padEnd(10)} loaded=${String(loaded.value).padEnd(6)} ${why}`);
}

console.log('\n   the ICU questions, which decide the timezone group:');
for (const expression of [
    "CAST('2026-07-01 12:00:00' AS TIMESTAMP) AT TIME ZONE 'America/New_York'",
    "CAST('2026-01-01 12:00:00' AS TIMESTAMP) AT TIME ZONE 'America/New_York'",
    "date_diff('second', CAST('2026-07-01 12:00:00' AS TIMESTAMP), (CAST('2026-07-01 12:00:00' AS TIMESTAMP) AT TIME ZONE 'Australia/Lord_Howe') AT TIME ZONE 'UTC')",
    "(SELECT count(*) FROM pg_timezone_names())",
    "strftime(CAST('2026-01-02 03:04:05' AS TIMESTAMP), '%A %B %-d %Y %I:%M %p')",
    "strptime('01/02/2026', '%m/%d/%Y')",
    "strptime('2026-01-02T03:04:05.678Z', '%Y-%m-%dT%H:%M:%S.%gZ')",
]) {
    const result = await tryOne(expression);
    console.log(`     ${result.ok ? 'ok  ' : 'FAIL'} ${expression.slice(0, 88)}`);
    console.log(`          -> ${JSON.stringify(result.value)}`);
}

close();
