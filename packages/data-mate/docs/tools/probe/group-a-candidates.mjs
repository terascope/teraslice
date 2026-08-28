/**
 * Can the six remaining "nothing in the way" functions be emitted as SQL?
 *
 * NEXT STEPS group A: `extract`, `encode`, `createID`, `intToIP`, `setPrecision`, `toNumber`.
 * Each one is blocked on a DuckDB behaviour that has to be MEASURED rather than assumed - which
 * hash functions exist and in what case, whether a VARCHAR-to-integer cast accepts the same
 * strings `BigInt()` does, and whether `round(v, d)` agrees with `Number.prototype.toFixed`.
 *
 * Prints one section per candidate. A section with no divergences promotes that function; a
 * section with divergences says exactly what the guard has to exclude.
 *
 *     node packages/data-mate/docs/tools/probe/group-a-candidates.mjs
 */
import { createHash } from 'node:crypto';
import { open } from '../lib/duck.mjs';

const { connection: conn, close } = await open();

const lit = (v) => `'${String(v).replaceAll("'", "''")}'`;

async function one(expression) {
    const reader = await conn.run(`SELECT ${expression} AS v`);
    const rows = await reader.getRowsJson();
    return rows[0][0];
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
    const bad = rows.filter((r) => !r.match);
    for (const row of rows) {
        const mark = row.match ? '  ' : '!!';
        console.log(`${mark} ${row.label.padEnd(46)} js=${String(row.js).slice(0, 34).padEnd(36)} sql=${String(row.sql).slice(0, 34)}`);
    }
    console.log(`   ${bad.length === 0 ? 'NO DIVERGENCES' : `${bad.length} of ${rows.length} DIVERGE`}`);
}

/* ------------------------------------------------------------------ 1. encode / createID */

const HASH_INPUTS = [
    'abc', '', '{ "some": "data" }', 'héllo', '👍👍', 'a b', ' leading', 'trailing ',
    'HELLO AND GOODBYE', 'ß', '́combining', 'x'.repeat(500),
];

const hashRows = [];
for (const algo of ['md5', 'sha1', 'sha256']) {
    for (const input of HASH_INPUTS) {
        const js = createHash(algo).update(input).digest('hex');
        const sql = await tryOne(`${algo}(${lit(input)})`);
        hashRows.push({
            label: `${algo}(${JSON.stringify(input).slice(0, 20)})`,
            js,
            sql: sql.value,
            match: sql.ok && sql.value === js,
        });
    }
}
report('encode/createID - hex digests vs node:crypto', hashRows);

// does a base64 DIGEST exist? `encodeSHA` needed one and there is none; check again for `encode`.
console.log('   base64 digest attempt:', JSON.stringify(await tryOne(`to_base64(unhex(sha256('abc')))`)));

const bufRows = [];
for (const input of HASH_INPUTS) {
    const jsHex = Buffer.from(input).toString('hex');
    const sqlHex = await tryOne(`lower(hex(encode(${lit(input)})))`);
    bufRows.push({
        label: `hex ${JSON.stringify(input).slice(0, 20)}`, js: jsHex, sql: sqlHex.value, match: sqlHex.ok && sqlHex.value === jsHex,
    });
    const jsB64 = Buffer.from(input).toString('base64');
    const sqlB64 = await tryOne(`to_base64(encode(${lit(input)}))`);
    bufRows.push({
        label: `base64 ${JSON.stringify(input).slice(0, 17)}`, js: jsB64, sql: sqlB64.value, match: sqlB64.ok && sqlB64.value === jsB64,
    });
}
report('encode - Buffer hex/base64 vs encode()+hex/to_base64', bufRows);

// the CASE question, stated on its own: `hex` is documented uppercase, `Buffer` is lowercase
console.log('   hex case:', await tryOne(`hex(encode('abc'))`), 'vs js', Buffer.from('abc').toString('hex'));

/* ------------------------------------------------------------------ 2. intToIP */

const CAST_STRINGS = [
    '168829138', '0', '4294967295', '4294967296', '012', '+12', '-12', ' 12 ', '12.0', '12.5',
    '1e3', '0x10', '0b11', '', 'abc', '1_000', '99999999999999999999999999999999999999',
];

const castRows = [];
for (const s of CAST_STRINGS) {
    let js;
    try {
        js = String(BigInt(s));
    } catch (err) {
        js = `THROW ${err.constructor.name}`;
    }
    const sql = await tryOne(`TRY_CAST(${lit(s)} AS HUGEINT)`);
    castRows.push({
        label: `BigInt vs TRY_CAST ${JSON.stringify(s)}`,
        js,
        sql: sql.value,
        // only informational: the emission guards with a digit regex, so a mismatch here is
        // exactly what that guard has to exclude
        match: String(sql.value) === js,
    });
}
report('intToIP - does TRY_CAST accept the same strings as BigInt()?', castRows);

const dotted = (n) => `CAST(${n} // 16777216 AS VARCHAR) || '.' || CAST((${n} // 65536) % 256 AS VARCHAR)`
    + ` || '.' || CAST((${n} // 256) % 256 AS VARCHAR) || '.' || CAST(${n} % 256 AS VARCHAR)`;

const ipUtils = await import(
    new URL('../../../../ip-utils/dist/src/index.js', import.meta.url).href
);
const ipRows = [];
for (const n of [0, 1, 255, 256, 168829138, 3232235777, 4294967295, 2130706433]) {
    const js = ipUtils.intToIP(n, 4);
    const sql = await tryOne(dotted(`CAST(${n} AS HUGEINT)`));
    ipRows.push({
        label: `intToIP(${n}, 4)`, js, sql: sql.value, match: sql.ok && sql.value === js,
    });
}
report('intToIP - dotted-quad arithmetic vs ip-utils', ipRows);

/* ------------------------------------------------------------------ 3. setPrecision */

const { setPrecision } = await import(
    new URL('../../../../core-utils/dist/src/index.js', import.meta.url).href
);

const PRECISION_NUMBERS = [
    10.123444, 10.253444, Math.PI, 8.29, 1.005, 2.675, 0.1, -10.253444, -8.29, -1.005,
    1e6, 1234.5678, 0, -0.0001, 99.995, 0.5, 1.5, 2.5, -2.5, 1e-7, 123456789.987654321,
];

const roundRows = [];
const truncRows = [];
for (const digits of [0, 1, 2, 4]) {
    for (const n of PRECISION_NUMBERS) {
        const jsRound = setPrecision(n, digits, false);
        const sqlRound = await tryOne(`round(CAST(${n} AS DOUBLE), ${digits})`);
        roundRows.push({
            label: `setPrecision(${n}, ${digits})`,
            js: jsRound,
            sql: sqlRound.value,
            match: sqlRound.ok && Number(sqlRound.value) === jsRound,
        });

        const jsTrunc = setPrecision(n, digits, true);
        // mirror `truncateNumber`: render at digits+5, then keep the first `digits` decimals
        const rendered = `printf('%.${digits + 5}f', CAST(${n} AS DOUBLE))`;
        const kept = digits === 0
            ? `split_part(${rendered}, '.', 1)`
            : `split_part(${rendered}, '.', 1) || '.' || substring(split_part(${rendered}, '.', 2), 1, ${digits})`;
        const sqlTrunc = await tryOne(`CAST(${kept} AS DOUBLE)`);
        truncRows.push({
            label: `truncate(${n}, ${digits})`,
            js: jsTrunc,
            sql: sqlTrunc.value,
            match: sqlTrunc.ok && Number(sqlTrunc.value) === jsTrunc,
        });
    }
}
report('setPrecision - round(v, d) vs parseFloat(v.toFixed(d))', roundRows);
report('setPrecision - printf-truncate vs truncateNumber', truncRows);

/*
 * `round()` is NOT `toFixed`: it diverges on 2.675 at 2 digits, because `toFixed` works on the
 * EXACT binary value (2.67499999...) and `round` rounds the decimal. Two candidates that might
 * work on the exact value instead - a DECIMAL cast and printf - measured over the same battery
 * plus the exact ties, which is where the two differ from each other.
 */
const TIES = [0.5, 1.5, 2.5, -2.5, 0.25, 0.75, 1.25, 1.375, -1.25, 3.5, 4.5, 0.125];
const decRows = [];
const pfRows = [];
for (const digits of [0, 1, 2, 4]) {
    for (const n of [...PRECISION_NUMBERS, ...TIES]) {
        const js = setPrecision(n, digits, false);
        const dec = await tryOne(`CAST(CAST(CAST(${n} AS DOUBLE) AS DECIMAL(38, ${digits})) AS DOUBLE)`);
        decRows.push({
            label: `DECIMAL(38,${digits}) of ${n}`, js, sql: dec.value, match: dec.ok && Number(dec.value) === js,
        });
        const pf = await tryOne(`CAST(printf('%.${digits}f', CAST(${n} AS DOUBLE)) AS DOUBLE)`);
        pfRows.push({
            label: `printf %.${digits}f of ${n}`, js, sql: pf.value, match: pf.ok && Number(pf.value) === js,
        });
    }
}
report('setPrecision - CAST AS DECIMAL(38, d) vs toFixed', decRows);
report('setPrecision - printf(%.df) vs toFixed', pfRows);
console.log('   DECIMAL on non-finite:', JSON.stringify(await tryOne(`CAST('nan'::DOUBLE AS DECIMAL(38, 2))`)));
console.log('   DECIMAL scale ceiling:', JSON.stringify(await tryOne(`CAST(1.5::DOUBLE AS DECIMAL(38, 39))`)));
console.log('   DECIMAL range overflow:', JSON.stringify(await tryOne(`CAST(1e30::DOUBLE AS DECIMAL(38, 20))`)));

console.log('   nan/inf:', JSON.stringify(await tryOne(`round('nan'::DOUBLE, 2)`)),
    JSON.stringify(await tryOne(`round('inf'::DOUBLE, 2)`)),
    JSON.stringify(await tryOne(`printf('%.7f', 'nan'::DOUBLE)`)));

/* ------------------------------------------------------------------ 4. toNumber */

const dateRows = [];
for (const iso of ['2001-01-01T01:00:00.000Z', '1970-01-01T00:00:00.000Z', '2026-08-21T13:45:06.789Z', '1900-03-01T00:00:00.000Z']) {
    const js = new Date(iso).getTime();
    const sql = await tryOne(`epoch_ms(CAST(${lit(iso)} AS TIMESTAMP))`);
    dateRows.push({
        label: `epoch millis ${iso}`, js, sql: sql.value, match: sql.ok && Number(sql.value) === js,
    });
}
report('toNumber - epoch_ms on a TIMESTAMP column', dateRows);

console.log('   a DOUBLE column can hold nan, and `toNumber` THROWS on it:',
    JSON.stringify(await tryOne(`isnan('nan'::DOUBLE)`)));

/* ------------------------------------------------------------------ 5. extract */

const extractRows = [];
const REGEX_CASES = [
    ['he.*', 'hello'],
    ['([A-Z]\\w+)', 'Hello World some other things'],
    ['\\d+', 'abc'],
    ['x*', 'abc'],
    ['a(b*)', 'a'],
    ['\\s', 'a b'],
    ['[0-9]+', 'a1b22c333'],
];
for (const [pattern, input] of REGEX_CASES) {
    const re = new RegExp(pattern, 'g');
    const all = [];
    let m = re.exec(input);
    while (m != null && m[0]) {
        if (m.length > 1) all.push(...m.slice(1));
        else all.push(m[0]);
        m = re.exec(input);
    }
    const js = all.length ? all[0] : null;
    const groups = new RegExp(pattern).exec('') === null ? (new RegExp(`${pattern}|`).exec('').length - 1) : 0;
    const expr = groups > 0
        ? `CASE WHEN nullif(regexp_extract(${lit(input)}, ${lit(pattern)}), '') IS NULL THEN NULL`
            + ` ELSE regexp_extract(${lit(input)}, ${lit(pattern)}, 1) END`
        : `nullif(regexp_extract(${lit(input)}, ${lit(pattern)}), '')`;
    const sql = await tryOne(expr);
    extractRows.push({
        label: `/${pattern}/ on ${JSON.stringify(input).slice(0, 16)} (${groups}g)`,
        js: JSON.stringify(js),
        sql: JSON.stringify(sql.value),
        match: sql.ok && JSON.stringify(sql.value ?? null) === JSON.stringify(js),
    });
}
report('extract - regex mode, first match', extractRows);

const markerRows = [];
const MARKER_CASES = [
    ['<hello>', '<', '>'],
    ['<hello> some stuff <world>', '<', '>'],
    ['no markers here', '<', '>'],
    ['<unterminated', '<', '>'],
    ['<a<b>', '<', '>'],
    ['><', '<', '>'],
    ['a|b|c', '|', '|'],
    ['<>', '<', '>'],
    ['line1\n<multi\nline>', '<', '>'],
];
for (const [input, start, end] of MARKER_CASES) {
    // the JavaScript state machine, verbatim from extract.ts
    const results = [];
    let found = false;
    let item = '';
    for (const ch of input) {
        if (found && ch === end) { found = false; results.push(item); item = ''; } else if (found) { item += ch; } else if (ch === start) { found = true; }
    }
    const js = results.length ? results[0] : null;
    // SQL: the substring between the first `start` and the first `end` after it
    const v = lit(input);
    const s = lit(start);
    const e = lit(end);
    const after = `substring(${v}, position(${s} IN ${v}) + 1)`;
    const expr = `CASE WHEN position(${s} IN ${v}) = 0 OR position(${e} IN ${after}) = 0 THEN NULL`
        + ` ELSE substring(${after}, 1, position(${e} IN ${after}) - 1) END`;
    const sql = await tryOne(expr);
    markerRows.push({
        label: `${JSON.stringify(input).slice(0, 24)} ${start}..${end}`,
        js: JSON.stringify(js),
        sql: JSON.stringify(sql.value),
        match: sql.ok && JSON.stringify(sql.value ?? null) === JSON.stringify(js),
    });
}
report('extract - start/end marker mode, first extraction', markerRows);

close();
