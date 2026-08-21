import { HAS_ASTRAL, isAsciiSql, sqlLiteral } from '../sql-helpers.js';

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
 * Whether a regex is safe to hand to RE2, DuckDB's engine.
 *
 * **RE2 has no lookaround and no backreferences**, and it does not degrade gracefully - the query
 * ERRORS. A JavaScript pattern using either is therefore not a slow path, it is a dead query, so
 * anything containing `(?=`, `(?!`, `(?<=`, `(?<!` or a `\1`-style backreference keeps the UDF.
 *
 * Named groups `(?<name>...)` are excluded by the same `(?<` test. That is stricter than necessary
 * - RE2 supports them as `(?P<name>...)` - and being stricter is the right side to err on.
*/
export function isRe2Safe(pattern: string): boolean {
    if (/\(\?[=!]/.test(pattern)) return false;
    if (/\(\?</.test(pattern)) return false;
    return !/\\[1-9]/.test(pattern);
}

/**
 * Whether a replacement string is a plain literal.
 *
 * **`$1` means a capture group in JavaScript and NOTHING in SQL** - measured, `'abc'` with
 * `/(a)(b)/g` and `'$2$1'` is `'bac'` in JavaScript and the literal `'$2$1c'` in DuckDB, which uses
 * `\1`. Translating is possible but `$&`, `` $` ``, `$'` and `$$` all mean something too, so a
 * replacement containing `$` keeps the UDF rather than being half-translated.
*/
export function isLiteralReplacement(replace: string): boolean {
    return !replace.includes('$');
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
 * Every character where RE2's `\s`, `\S` and `.` disagree with JavaScript's, as an RE2 class.
 *
 * **`isRe2Safe` is not sufficient on its own, and this is the measurement that says so.** It only
 * rejects the constructs RE2 cannot COMPILE. A pattern both engines compile can still match
 * different characters, and that failure is silent - a different answer, not an error.
 *
 * Measured by `docs/tools/probe/re2-vs-js-regex.mjs` over all 28 characters that could differ:
 *
 * - **`\s` diverges on 20 of them.** JavaScript's `\s` is `WhiteSpace` + `LineTerminator`, so it
 *   accepts VERTICAL TAB, NBSP, the whole `Zs` category, U+2028, U+2029 and the BOM. RE2's `\s` is
 *   exactly `[\t\n\f\r ]`. `\S`, being the complement, inverts on the same 20.
 * - **`.` diverges on 3.** JavaScript's `.` excludes CR, U+2028 and U+2029 as well as LF; RE2's
 *   excludes only LF.
 * - **`\w`, `\d` and `\b` AGREE on all 28** - both engines are ASCII-only there, so a pattern built
 *   from those needs no guard at all.
 *
 * **The gate then added a second half the probe had not asked about: ASTRAL input.** A pattern that
 * matches "any character" - `.`, `\S`, a negated class - consumes one UTF-16 CODE UNIT in
 * JavaScript and one CODE POINT in RE2, so `/\S/g` replacing over `'\u{1D518}nicode'` produces
 * TWO replacements per astral character in JavaScript and one in SQL. Translating the class cannot
 * fix that, because it is the unit of matching rather than the class membership - so `HAS_ASTRAL`
 * joins this class in `withClassGuard`, which is why that guard is built from both.
 *
 * So the guard is on the VALUE, not the pattern - the same shape as `HAS_ASTRAL` elsewhere. A value
 * holding none of these characters gets the native path; one that does keeps the UDF, where
 * JavaScript's own classes and code units apply.
*/
export const RE2_CLASS_DIVERGENCE = '[\\x{0b}\\x{0d}\\x{a0}\\x{1680}\\x{2000}-\\x{200a}'
    + '\\x{2028}\\x{2029}\\x{202f}\\x{205f}\\x{3000}\\x{feff}]';

/**
 * Whether a pattern contains a class whose definition differs between the engines.
 *
 * Only `.`, `\s` and `\S` do - see `RE2_CLASS_DIVERGENCE`. A `.` inside a character class (`[.]`)
 * is a literal dot and needs no guard, but distinguishing that means parsing the pattern, so any
 * `.` at all asks for the guard. Over-guarding costs a UDF call for exotic values; under-guarding
 * returns a wrong answer.
*/
export function needsClassGuard(pattern: string): boolean {
    return /\\[sS]/.test(pattern) || pattern.includes('.') || pattern.includes('[^');
}

/**
 * A pattern whose ESCAPES mean the same thing to both engines.
 *
 * `\p{...}`/`\P{...}` are Unicode property escapes to RE2 always, and to JavaScript **only under
 * the `u` flag** - without it `\p` is an identity escape, so `/\p{L}/` matches the literal text
 * `p{L}`. `\u{...}` is the same story. Neither errors, so both are silent divergences and both
 * keep the UDF.
*/
export function hasPortableEscapes(pattern: string): boolean {
    return !/\\[pP]\{/.test(pattern) && !/\\u\{/.test(pattern);
}

/**
 * Guards a native regex expression with the value-level class check, when the pattern needs it.
 *
 * The whole point of `needs_udf_fallback`: the native path runs for every value that cannot be
 * affected by the divergence, which is all real text, and the UDF answers for the rest.
*/
export function withClassGuard(
    pattern: string,
    value: string,
    native: string,
    udf: (v: string) => string
): string {
    if (!needsClassGuard(pattern)) return native;
    const guard = `${RE2_CLASS_DIVERGENCE.slice(0, -1)}${HAS_ASTRAL.slice(1)}`;
    return `CASE WHEN regexp_matches(${value}, ${sqlLiteral(guard)})`
        + ` THEN ${udf(value)} ELSE ${native} END`;
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

/** A literal, escaped for use inside an RE2 pattern. */
export function re2Literal(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * How many capture groups a pattern has, and whether the emission can express it.
 *
 * `matchAll` pushes ALL groups of every match, interleaved - `regexp_extract_all` takes one group
 * index - so more than one group has no native form. Counted by compiling `pattern|`, which matches
 * the empty string and reports the group count without needing the pattern to match anything.
*/
export function countGroups(pattern: string): number | null {
    try {
        const probe = new RegExp(`${pattern}|`).exec('');
        return probe ? probe.length - 1 : null;
    } catch {
        return null;
    }
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
