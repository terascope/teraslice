import { isAsciiSql, sqlLiteral } from '../sql-helpers.js';
import { re2Literal } from './sql-regex-utils.js';

/**
 * Helpers shared by the SQL expressions on the string function configs.
*/

/**
 * `validator.isAlpha`'s `en-US` alphabet, as an RE2 pattern.
 *
 * Other locales use different letter sets, and several cannot be written as a simple class, so the
 * functions using this handle only the default locale.
*/
export const ALPHA_LOCALES = '^[A-Za-z]+$';

/** `validator.isAlphanumeric`'s `en-US` set. */
export const ALPHANUMERIC_LOCALES = '^[0-9A-Za-z]+$';

/** True when no locale was given, so `validator`'s `en-US` default applies. */
export function defaultLocale(locale: unknown): boolean {
    return locale == null || locale === 'en-US';
}

/**
 * `encodeURIComponent`, built from `url_encode` plus the five characters it over-escapes.
 *
 * `url_encode` percent-escapes `!`, `'`, `(`, `)` and `*`, which `encodeURIComponent` leaves alone.
 * Unescaping them afterwards is safe: a literal `%` in the input is already `%25` by then, so a
 * `%21` in the output can only come from a real `!`.
*/
export function encodeURIComponentSql(value: string): string {
    const unescape: [string, string][] = [
        ['%21', '!'], ['%27', '\'\''], ['%28', '('], ['%29', ')'], ['%2A', '*'],
    ];
    return unescape.reduce(
        (inner, [escaped, literal]) => `replace(${inner}, '${escaped}', '${literal}')`,
        `url_encode(${value})`
    );
}

/**
 * `validator.isHash`'s length table, copied from its source. The check is only `^[a-fA-F0-9]{N}$`.
*/
export const HASH_LENGTHS: Record<string, number> = {
    md5: 32,
    md4: 32,
    sha1: 40,
    sha256: 64,
    sha384: 96,
    sha512: 128,
    ripemd128: 32,
    ripemd160: 40,
    tiger128: 32,
    tiger160: 40,
    tiger192: 48,
    crc32: 8,
    crc32b: 8,
};

/**
 * `validator.isUUID`'s per-version patterns, copied from its source.
 *
 * The default, `all`, is not the union of the numbered versions: it accepts versions 1-8 plus the
 * nil and max UUIDs, and still requires the `[89ab]` variant nibble. It is written out rather than
 * derived. None of the patterns use lookaround or backreferences, so RE2 compiles all of them.
*/
const UUID_HEX = '[0-9a-fA-F]';
const UUID_TAIL = `${UUID_HEX}{8}-${UUID_HEX}{4}`;

export function uuidPattern(version: unknown): string | null {
    if (version == null || version === 'all') {
        return `^(?:${UUID_TAIL}-[1-8]${UUID_HEX}{3}-[89abAB]${UUID_HEX}{3}-${UUID_HEX}{12}`
            + '|00000000-0000-0000-0000-000000000000'
            + '|[fF]{8}-[fF]{4}-[fF]{4}-[fF]{4}-[fF]{12})$';
    }
    if (version === 'nil') return '^00000000-0000-0000-0000-000000000000$';
    if (version === 'max') return `^[fF]{8}-[fF]{4}-[fF]{4}-[fF]{4}-[fF]{12}$`;
    if (version === 'loose') {
        return `^${UUID_TAIL}-${UUID_HEX}{4}-${UUID_HEX}{4}-${UUID_HEX}{12}$`;
    }
    if (typeof version === 'number' || typeof version === 'string') {
        const digit = String(version);
        if (/^[1-8]$/.test(digit)) {
            return `^${UUID_TAIL}-${digit}${UUID_HEX}{3}-[89abAB]${UUID_HEX}{3}-${UUID_HEX}{12}$`;
        }
    }
    return null;
}

/**
 * lodash's test for which word splitter to use. The case converters run in SQL only when it does
 * not match.
 *
 * `_.camelCase` and the other converters run `words(deburr(string).replace(/['’]/g, ''))`, and
 * `words` picks one of two algorithms:
 *
 * ```js
 * var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
 * var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
 * ```
 *
 * When `reHasUnicodeWord` does not match, the result is `string.match(reAsciiWord)`, which splits
 * on ASCII punctuation only, and SQL reproduces that exactly. The other algorithm handles case
 * transitions, digit/letter boundaries, acronyms like `XMLHttpRequest` and combining marks, and
 * keeps the UDF.
 *
 * `deburr` does nothing to input this guard admits, which contains only `[a-zA-Z0-9 ]`.
*/
export const HAS_UNICODE_WORD = '[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]';

/** The words of an ASCII-path string, as a SQL list. */
function asciiWords(value: string): string {
    return `regexp_extract_all(${value}, '[a-zA-Z0-9]+')`;
}

/**
 * A case conversion over the ASCII word list.
 *
 * `join` is the separator between words; `first` and `rest` say how each word is cased. An empty
 * word list gives `''`, which is what `_.camelCase('')` and `_.camelCase('---')` return.
*/
export function caseConvertSql(
    value: string,
    options: { join: string; first: (word: string) => string; rest: (word: string) => string }
): string {
    const words = asciiWords(value);
    const { join, first, rest } = options;
    const tail = `list_transform(${words}[2:], lambda w : ${rest('w')})`;
    return `CASE WHEN len(${words}) = 0 THEN ''`
        + ` ELSE array_to_string(list_prepend(${first(`${words}[1]`)}, ${tail}), '${join}') END`;
}

/** `word[0].toUpperCase() + word.slice(1).toLowerCase()`, which is lodash's `capitalize`. */
export function capitalizeSql(word: string): string {
    return `upper(substring(${word}, 1, 1)) || lower(substring(${word}, 2))`;
}

/**
 * `_.upperFirst`: the first character uppercased and the rest left as is.
 *
 * This is not `capitalize`, which also lowercases the rest. `_.startCase` uses this one, which is
 * why `startCase('HELLO WORLD')` is `'HELLO WORLD'` and not `'Hello World'`.
*/
export function upperFirstSql(word: string): string {
    return `upper(substring(${word}, 1, 1)) || substring(${word}, 2)`;
}

/**
 * Base64 validation per RFC 4648 with padding, `validator.isBase64`'s default.
 *
 * ```js
 * var base64WithPadding = /^[A-Za-z0-9+/]+={0,2}$/;
 * if (str === '') return true;
 * if (options.padding && str.length % 4 !== 0) return false;
 * ```
 *
 * This intentionally does not reproduce `core-utils`' `isBase64`, which also requires a UTF-8 round
 * trip to be lossless. `toString('utf8')` replaces every invalid byte with U+FFFD, so that check
 * accepts only base64 of UTF-8 text and rejects most base64-encoded binary.
*/
export function isBase64Sql(value: string): string {
    return `(${value} = '' OR (length(${value}) % 4 = 0`
        + ` AND regexp_matches(${value}, '^[A-Za-z0-9+/]+={0,2}$')))`;
}

/**
 * `validator.isFQDN` with its default options, for ASCII input.
 *
 * The function has no TLD list, which is what makes it expressible in SQL. With the defaults
 * (`require_tld`, no underscores, no trailing dot, no wildcard, no numeric TLD, max length
 * enforced) the algorithm is:
 *
 * 1. at least two dot-separated parts;
 * 2. the last part matches `/^([a-z…]{2,}|xn[a-z0-9-]{2,})$/i`, contains no whitespace and is not
 *    all digits;
 * 3. every part is 1-63 characters, matches `/^[a-z_0-9-]+$/i`, has no full-width character, and
 *    neither starts nor ends with `-`; and with `allow_underscores` false, contains no `_`.
 *
 * Non-ASCII input keeps the UDF. `validator`'s character classes run to `\u{ffff}` and include a
 * full-width exclusion, which is not worth reproducing.
*/
export function isFQDNSql(value: string, udf: (v: string) => string): string {
    const parts = `string_split(${value}, '.')`;
    const tld = `${parts}[-1]`;
    const badPart = `list_filter(${parts}, lambda p :`
        + ' NOT regexp_matches(p, \'^[A-Za-z0-9](([A-Za-z0-9-]{0,61})[A-Za-z0-9])?$\'))';
    // non-ASCII goes to the UDF rather than being answered false: `validator`'s classes run to
    // \u{ffff}, so `exämple.com` is a valid domain to it
    return `CASE WHEN NOT ${isAsciiSql(value)} THEN ${udf(value)} ELSE (`
        + `len(${parts}) >= 2`
        + ` AND regexp_matches(${tld}, '^([A-Za-z]{2,}|[xX][nN][A-Za-z0-9-]{2,})$')`
        + ` AND len(${badPart}) = 0) END`;
}

/**
 * A hash or byte encoding of a string in SQL, shared by `encode` and `createID`.
 *
 * Returns null for a combination DuckDB cannot express, which is what the callers' `applies` check.
 * The results match `node:crypto` and `Buffer` byte for byte, including for empty, non-ASCII,
 * astral and combining-mark input:
 *
 * - `md5`, `sha1` and `sha256` return a lowercase hex digest, matching
 *   `createHash(...).digest('hex')`. There is no `sha512` or `sha384`.
 * - A base64 digest is `to_base64(unhex(<digest>))`.
 * - `Buffer.from(x).toString('hex')` is `lower(hex(encode(x)))`. `hex()` is uppercase, and
 *   `encode()` is used because a VARCHAR-to-BLOB cast rejects non-ASCII.
 * - `Buffer.from(x).toString('base64')` is `to_base64(encode(x))`.
*/
export const SQL_HASHES: readonly string[] = ['md5', 'sha1', 'sha256'];

export function hashSql(algo: string, digest: string, value: string): string | null {
    if (algo === 'hex') return `lower(hex(encode(${value})))`;
    if (algo === 'base64') return `to_base64(encode(${value}))`;
    if (!SQL_HASHES.includes(algo)) return null;
    if (digest === 'hex') return `${algo}(${value})`;
    if (digest === 'base64') return `to_base64(unhex(${algo}(${value})))`;
    return null;
}

/** Whether `hashSql` has an expression for this pair, so an `applies` need not build it. */
export function hasHashSql(algo: unknown, digest: unknown): boolean {
    if (typeof algo !== 'string') return false;
    if (digest != null && digest !== 'hex' && digest !== 'base64') return false;
    return hashSql(algo, (digest as string) ?? 'hex', 'x') != null;
}

/**
 * Whether a value is a single code point (not a single UTF-16 code unit).
 *
 * `extract`'s marker mode compares `char === start` while iterating code points, so a
 * multi-character marker never matches and an astral one matches as a unit.
*/
export function isOneCodePoint(value: unknown): boolean {
    return typeof value === 'string' && [...value].length === 1;
}

/**
 * `extract`'s marker mode: the text between the first `start` and the first `end` after it.
 *
 * This mirrors `_subSlice`, which finds `start` and then collects characters until `end`. A second
 * `start` before the `end` is content (`'<a<b>'` extracts `'a<b'`), an unterminated run yields
 * null, and `'a|b|c'` with `|` for both markers extracts `'b'`.
*/
export function extractMarkerSql(value: string, start: string, end: string): string {
    const s = sqlLiteral(start);
    const e = sqlLiteral(end);
    const after = `substring(${value}, position(${s} IN ${value}) + 1)`;
    return `CASE WHEN position(${s} IN ${value}) = 0 OR position(${e} IN ${after}) = 0 THEN NULL`
        + ` ELSE substring(${after}, 1, position(${e} IN ${after}) - 1) END`;
}

/**
 * `extract`'s marker mode with `global`: every extraction, as a list.
 *
 * The repeated scan is a non-greedy `(?s).*?` between the two escaped markers. `(?s)` is required
 * because the scan collects newlines and RE2's `.` does not match one without it. For example,
 * `'a|b|c|d'` gives `['b']` and `'<>'` gives `['']`.
*/
export function extractMarkerAllSql(value: string, start: string, end: string): string {
    const pattern = `${re2Literal(start)}((?s).*?)${re2Literal(end)}`;
    return `regexp_extract_all(${value}, ${sqlLiteral(pattern)}, 1)`;
}

/**
 * `extract`'s regex mode, built from what `matchAll` does.
 *
 * `matchAll` forces the `g` flag and, per match, collects every capture group if the pattern has
 * any, or the whole match otherwise. `extract` then takes the first element, or the whole list
 * under `global`. So the SQL is `regexp_extract` at group 0 or 1, and `regexp_extract_all` for the
 * list.
 *
 * The no-match case needs care. `matchAll` returns null when nothing matched, and its loop also
 * stops on an empty match, so a pattern whose first match is empty gives null, not `''`.
 * `regexp_extract` returns `''` for both, which `nullif` maps to null. When extracting a group, the
 * whole match is tested first, because a group can capture the empty string inside a non-empty
 * match.
*/
export function extractRegexSql(
    value: string, pattern: string, group: number
): string {
    const pat = sqlLiteral(pattern);
    const whole = `nullif(regexp_extract(${value}, ${pat}), '')`;
    if (group === 0) return whole;
    return `CASE WHEN ${whole} IS NULL THEN NULL`
        + ` ELSE regexp_extract(${value}, ${pat}, ${group}) END`;
}

/** `extract`'s regex mode with `global`: every match, or every first capture group. */
export function extractRegexAllSql(
    value: string, pattern: string, group: number
): string {
    return `regexp_extract_all(${value}, ${sqlLiteral(pattern)}, ${group})`;
}

/**
 * A list expression that returns NULL rather than `[]` when nothing matched.
 *
 * `extract` under `global` returns null for no match in both modes, never an empty list, while
 * `regexp_extract_all` returns `[]`.
*/
export function emptyToNull(list: string): string {
    return `CASE WHEN len(${list}) = 0 THEN NULL ELSE ${list} END`;
}

/**
 * `isPhoneNumberLike`: strip every non-digit and check that 7 to 20 digits remain. It does not use
 * libphonenumber.
 *
 * ```
 * const testValue = toString(input).trim().replace(/\D/g, '');
 * return inNumberRange(testValue.length, { min: 7, max: 20, inclusive: true });
 * ```
 *
 * `trim()` cannot change the answer because whitespace is not a digit. `\D` is `[^0-9]` in both
 * engines, and the remaining digits are ASCII, so `length()` counting characters agrees with
 * JavaScript counting code units.
*/
export function phoneNumberLikeSql(value: string): string {
    return `length(regexp_replace(${value}, '[^0-9]', '', 'g')) BETWEEN 7 AND 20`;
}

/**
 * Shannon entropy without an aggregate: split into characters, count each distinct one, and sum the
 * terms.
 *
 * `list_filter` over the distinct characters does the per-character counting. It is quadratic in
 * the number of distinct characters, which for text is bounded by the alphabet rather than the
 * string length. The result is exact.
 *
 * The JavaScript builds its frequency table over code points (`for (const char of input)`) but
 * divides by `input.length`, which counts UTF-16 code units. The two differ only for astral input,
 * so astral input keeps the UDF.
*/
export function shannonEntropySql(value: string): string {
    const chars = `string_split(${value}, '')`;
    const counts = `list_transform(list_distinct(${chars}),`
        + ` lambda c : len(list_filter(${chars}, lambda x : x = c)))`;
    const total = `len(${chars})`;
    const terms = `list_transform(${counts},`
        + ` lambda n : -((n / ${total}) * ln(n / ${total}) / ln(2)))`;
    // `+ 0` turns negative zero into zero: for a string with one distinct character the term is
    // `-(1 * 0 / ln(2))` = `-0`, where the JavaScript gets `0`. Same approach as
    // `withinIntegerRange`.
    return `CASE WHEN ${total} = 0 THEN 0`
        + ` ELSE list_reduce(${terms}, lambda a, b : a + b) + 0 END`;
}
