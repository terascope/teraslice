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
