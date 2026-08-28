import { isAsciiSql, sqlLiteral } from '../sql-helpers.js';
import { re2Literal } from './sql-regex-utils.js';

/**
 * Helpers shared by the `sql` emissions on the string function configs.
*/

/**
 * `validator.isAlpha`'s `en-US` alphabet, as an RE2 pattern.
 *
 * Taken from `validator`'s own locale table, not from the function name. Every other locale has a
 * different letter set - and several are not expressible as a simple class - so the emissions that
 * use this claim the DEFAULT locale only.
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
 * Measured: `url_encode` percent-escapes `!`, `'`, `(`, `)` and `*`, and `encodeURIComponent`
 * leaves all five alone - the only difference over a battery that also covers spaces, `+`, `%`,
 * non-ASCII and astral input.
 *
 * **Un-escaping them afterwards is safe, not a heuristic.** A literal `%` in the input is already
 * `%25` by the time these run, so a `%21` in `url_encode`'s output can only have come from a real
 * `!`. Verified with `'%21 literal'` and `'%2A%27'` in the battery.
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
 * `validator.isHash`'s length table, transliterated from its source.
 *
 * The check is only `^[a-fA-F0-9]{N}$` - there is nothing subtler in it, which is what makes this
 * one of the three `validator`-backed predicates that can be stated exactly.
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
 * `validator.isUUID`'s per-version patterns, transliterated from its source.
 *
 * `all` is the default and is NOT the union of the numbered versions - it accepts variants 1-8 plus
 * the nil and max UUIDs, and rejects the `[89ab]` variant nibble being anything else. Written out
 * rather than derived, because deriving it is where a guess would creep in.
 *
 * None of these use lookaround or a backreference, so RE2 compiles all of them.
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
 * lodash's word splitting, for the ASCII case only - which is what makes the case converters
 * promotable at all.
 *
 * `_.camelCase` and friends run `words(deburr(string).replace(/['’]/g, ''))`, and `words`
 * picks one of two algorithms:
 *
 * ```js
 * var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
 * var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
 * ```
 *
 * When `reHasUnicodeWord` does NOT match, the whole thing is `string.match(reAsciiWord)` - split on
 * ASCII punctuation, nothing else. That path is exactly reproducible. The unicode path handles
 * case transitions, digit/letter boundaries, acronyms like `XMLHttpRequest` and combining marks,
 * and is not; it keeps the UDF.
 *
 * `deburr` is a no-op for input this guard admits, since it only contains `[a-zA-Z0-9 ]`.
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
 * `_.upperFirst`: the first character uppercased and **the rest left alone**.
 *
 * Not `capitalize`, which also lowercases the tail. `_.startCase` uses this one, which is why
 * `startCase('HELLO WORLD')` is `'HELLO WORLD'` and not `'Hello World'`.
*/
export function upperFirstSql(word: string): string {
    return `upper(substring(${word}, 1, 1)) || substring(${word}, 2)`;
}

/**
 * **Correct** base64 validation — RFC 4648 with padding, which is `validator.isBase64`'s default.
 *
 * ```js
 * var base64WithPadding = /^[A-Za-z0-9+/]+={0,2}$/;
 * if (str === '') return true;
 * if (options.padding && str.length % 4 !== 0) return false;
 * ```
 *
 * This deliberately does NOT reproduce `core-utils`' `isBase64`, which is broken: it wraps
 * `validator` in a lossy UTF-8 round trip and so **rejects 99.3% of valid base64-encoded binary**.
 * See `docs/known-defects.md` DF9 for the measurement and the reproduction.
*/
export function isBase64Sql(value: string): string {
    return `(${value} = '' OR (length(${value}) % 4 = 0`
        + ` AND regexp_matches(${value}, '^[A-Za-z0-9+/]+={0,2}$')))`;
}

/**
 * `validator.isFQDN` with its default options, for ASCII input.
 *
 * Transliterated from source rather than inferred - and there is **no TLD list** in it, which is
 * what makes it expressible at all. With the defaults (`require_tld`, no underscores, no trailing
 * dot, no wildcard, no numeric TLD, max length enforced) the algorithm is:
 *
 * 1. at least two dot-separated parts;
 * 2. the last part matches `/^([a-z…]{2,}|xn[a-z0-9-]{2,})$/i`, contains no whitespace and is not
 *    all digits;
 * 3. every part is 1-63 characters, matches `/^[a-z_0-9-]+$/i`, has no full-width character, and
 *    neither starts nor ends with `-`; and with `allow_underscores` false, contains no `_`.
 *
 * The guard is ASCII: the real character classes run to `\u{ffff}` and include a full-width
 * exclusion, and reproducing those exactly is not worth the risk when non-ASCII domains can have
 * the UDF.
*/
export function isFQDNSql(value: string, udf: (v: string) => string): string {
    const parts = `string_split(${value}, '.')`;
    const tld = `${parts}[-1]`;
    const badPart = `list_filter(${parts}, lambda p :`
        + ' NOT regexp_matches(p, \'^[A-Za-z0-9](([A-Za-z0-9-]{0,61})[A-Za-z0-9])?$\'))';
    // non-ASCII goes to the UDF rather than being answered false: `validator`'s classes run to
    // \u{ffff}, so `exämple.com` is a VALID domain to it
    return `CASE WHEN NOT ${isAsciiSql(value)} THEN ${udf(value)} ELSE (`
        + `len(${parts}) >= 2`
        + ` AND regexp_matches(${tld}, '^([A-Za-z]{2,}|[xX][nN][A-Za-z0-9-]{2,})$')`
        + ` AND len(${badPart}) = 0) END`;
}

/**
 * A hash or byte-encoding of a string, in SQL - shared by `encode` and `createID`.
 *
 * Returns null for a combination DuckDB cannot express, which is how the callers' `applies` decide.
 * Measured against `node:crypto` and `Buffer` over a 12-input battery covering empty, non-ASCII,
 * astral, combining-mark and 500-character input - all 60 comparisons byte-equal
 * (`docs/tools/probe/group-a-candidates.mjs`):
 *
 * - `md5`, `sha1` and `sha256` exist and return a **lowercase hex** digest, matching
 *   `createHash(...).digest('hex')`. There is no `sha512` and no `sha384`.
 * - a **base64 digest** is `to_base64(unhex(<digest>))`, which is why `encode` can offer one where
 *   `encodeSHA` could not.
 * - `Buffer.from(x).toString('hex')` is `lower(hex(encode(x)))` - `hex()` is UPPERCASE and
 *   `Buffer` is lowercase, and `encode()` rather than `::BLOB` because a VARCHAR-to-BLOB cast
 *   refuses non-ASCII.
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
 * A single character, as a code point rather than a UTF-16 code unit.
 *
 * `extract`'s marker mode compares `char === start` inside `for (const char of input)`, which
 * iterates CODE POINTS - so a multi-character `start` can never match anything and an astral one
 * matches as a single unit. The emission therefore claims exactly one code point.
*/
export function isOneCodePoint(value: unknown): boolean {
    return typeof value === 'string' && [...value].length === 1;
}

/**
 * `extract`'s marker mode: the text between the first `start` and the first `end` after it.
 *
 * **This mirrors a state machine, not a regex.** `_subSlice` scans for `start`, then collects every
 * character until `end` - so a second `start` before the `end` is CONTENT (`'<a<b>'` extracts
 * `'a<b'`), an unterminated run yields nothing, and `'a|b|c'` with `|` for both markers extracts
 * `'b'`. All nine shapes agree, including newlines and `'<>'` extracting the empty string
 * (`docs/tools/probe/group-a-candidates.mjs`).
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
 * The repeated form of the same state machine, and a regex expresses it exactly: a non-greedy
 * `(?s).*?` between the two escaped markers. `(?s)` is required - the machine collects newlines
 * and RE2's `.` does not match one without it. Verified against the state machine on all seven
 * shapes, including `'a|b|c|d'` giving `['b']` and `'<>'` giving `['']`.
*/
export function extractMarkerAllSql(value: string, start: string, end: string): string {
    const pattern = `${re2Literal(start)}((?s).*?)${re2Literal(end)}`;
    return `regexp_extract_all(${value}, ${sqlLiteral(pattern)}, 1)`;
}

/**
 * `extract`'s regex mode, built from what `matchAll` actually does.
 *
 * `matchAll` forces the `g` flag, and per match pushes **every capture group** when the pattern has
 * any and the whole match otherwise - then `extract` takes the first element, or the whole list
 * under `global`. So the emission is `regexp_extract` at group 0 or 1, and `regexp_extract_all` for
 * the list.
 *
 * **The no-match case is why this is not a one-liner.** `matchAll` returns null when nothing
 * matched, and its loop also STOPS on an empty match - so a pattern whose first match is empty
 * gives null, not `''`. `regexp_extract` returns `''` for both, which `nullif` maps to null;
 * where a group is extracted the whole-match result is tested first, because a group can legally
 * capture the empty string inside a non-empty match.
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
 * A list expression that answers NULL rather than `[]` when nothing matched.
 *
 * **`extract` under `global` returns null for no match, not an empty list.** `matchAll` returns
 * null when its loop pushed nothing, and `getSubslice` only returns `results` `if (results.length)`
 * and falls through to `return null` otherwise - so both modes agree on that and neither produces
 * `[]`. `regexp_extract_all` produces exactly `[]`, which the gate caught.
*/
export function emptyToNull(list: string): string {
    return `CASE WHEN len(${list}) = 0 THEN NULL ELSE ${list} END`;
}

/**
 * `isPhoneNumberLike`, and it is **not libphonenumber**.
 *
 * ```
 * const testValue = toString(input).trim().replace(/\D/g, '');
 * return inNumberRange(testValue.length, { min: 7, max: 20, inclusive: true });
 * ```
 *
 * Strip every non-digit, count what is left, ask whether it is 7 to 20. `trim()` cannot change the
 * answer - whitespace is not a digit, so it is stripped either way - and `\D` is `[^0-9]` in both
 * engines (measured: `\d` and `\w` agree on all 28 characters where they could differ). The digits
 * that remain are ASCII, so `length()` counting characters and JavaScript counting code units
 * agree.
 *
 * `isISDN` and `toISDN` really are libphonenumber; this one only shares their file.
*/
export function phoneNumberLikeSql(value: string): string {
    return `length(regexp_replace(${value}, '[^0-9]', '', 'g')) BETWEEN 7 AND 20`;
}

/**
 * Shannon entropy with no aggregate: split to characters, count each distinct one, fold the terms.
 *
 * `list_filter` over the distinct characters is the per-character aggregation that was called
 * impossible inside a scalar expression. It is quadratic in the number of DISTINCT characters,
 * which for text is bounded by the alphabet rather than by the string length.
 *
 * Verified against `shannonEntropy` on nine inputs including the empty string, a single character,
 * an all-same string and non-ASCII - **exact, not approximate** (`tools/probe/remaining-26.mjs`).
 *
 * The divisor is the character count, and that is where the JavaScript is internally inconsistent:
 * it builds the frequency table with `for (const char of input)`, which iterates CODE POINTS, and
 * divides by `input.length`, which counts CODE UNITS. The two differ only for astral input, so
 * astral input keeps the UDF rather than the emission reproducing the inconsistency.
*/
export function shannonEntropySql(value: string): string {
    const chars = `string_split(${value}, '')`;
    const counts = `list_transform(list_distinct(${chars}),`
        + ` lambda c : len(list_filter(${chars}, lambda x : x = c)))`;
    const total = `len(${chars})`;
    const terms = `list_transform(${counts},`
        + ` lambda n : -((n / ${total}) * ln(n / ${total}) / ln(2)))`;
    // `+ 0` normalises NEGATIVE ZERO, which is the only thing the gate found wrong here: for a
    // single-distinct-character string `p` is 1 and the term is `-(1 * 0 / ln(2))` = `-0`, where
    // the JavaScript accumulates `0 - 0` and gets `0`. Same trick as `withinIntegerRange`.
    return `CASE WHEN ${total} = 0 THEN 0`
        + ` ELSE list_reduce(${terms}, lambda a, b : a + b) + 0 END`;
}
