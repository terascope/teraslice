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
