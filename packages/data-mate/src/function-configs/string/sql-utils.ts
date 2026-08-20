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
