import { HAS_ASTRAL, JS_WHITESPACE, sqlLiteral } from '../sql-helpers.js';

/**
 * Where DuckDB's regex engine (RE2) and JavaScript's differ.
 *
 * Some differences stop RE2 from compiling a pattern, which fails loudly. Others compile in both
 * engines but match different characters, which silently returns a different answer. The helpers
 * here detect both.
*/
/**
 * Whether a regex can be handed to RE2, DuckDB's engine.
 *
 * RE2 has no lookaround and no backreferences, and the query errors if a pattern uses them.
 * Anything containing `(?=`, `(?!`, `(?<=`, `(?<!` or a backreference like `\1` keeps the UDF.
 *
 * Named groups `(?<name>...)` are excluded by the same `(?<` test. RE2 supports them as
 * `(?P<name>...)`, so this is stricter than necessary, which is the safe direction.
*/
export function isRe2Safe(pattern: string): boolean {
    if (/\(\?[=!]/.test(pattern)) return false;
    if (/\(\?</.test(pattern)) return false;
    return !/\\[1-9]/.test(pattern);
}
/**
 * Whether a replacement string is a plain literal.
 *
 * `$1` is a capture group in JavaScript but literal text in DuckDB, which uses `\1`: `'abc'` with
 * `/(a)(b)/g` and `'$2$1'` gives `'bac'` in JavaScript and `'$2$1c'` in DuckDB. `$&`, `` $` ``,
 * `$'` and `$$` also have meanings, so any replacement containing `$` keeps the UDF.
*/
export function isLiteralReplacement(replace: string): boolean {
    return !replace.includes('$');
}
/**
 * Every character where RE2's `\s`, `\S` and `.` disagree with JavaScript's, as an RE2 class.
 *
 * A pattern that passes `isRe2Safe` can still match different characters in the two engines:
 *
 * - `\s` differs on 20 characters. JavaScript's `\s` includes vertical tab, NBSP, the whole `Zs`
 *   category, U+2028, U+2029 and the BOM; RE2's is exactly `[\t\n\f\r ]`. `\S` differs on the same
 *   20.
 * - `.` differs on 3. JavaScript's `.` excludes CR, U+2028 and U+2029 as well as LF; RE2's excludes
 *   only LF.
 * - `\w`, `\d` and `\b` agree, because both engines are ASCII-only there.
 *
 * Astral input is a separate problem. A pattern that matches any character (`.`, `\S`, a negated
 * class) consumes one UTF-16 code unit in JavaScript and one code point in RE2, so `/\S/g` makes
 * two replacements per astral character in JavaScript and one in SQL. Translating the class cannot
 * fix that, so `withClassGuard` combines this class with `HAS_ASTRAL`.
 *
 * The guard is applied to the value, not the pattern: a value containing none of these characters
 * takes the native path, and one that does keeps the UDF.
*/
export const RE2_CLASS_DIVERGENCE = '[\\x{0b}\\x{0d}\\x{a0}\\x{1680}\\x{2000}-\\x{200a}'
    + '\\x{2028}\\x{2029}\\x{202f}\\x{205f}\\x{3000}\\x{feff}]';
/**
 * Whether a pattern contains a class whose meaning differs between the engines.
 *
 * Only `.`, `\s`, `\S` and negated classes do; see `RE2_CLASS_DIVERGENCE`. A `.` inside a character
 * class (`[.]`) is a literal dot, but detecting that requires parsing the pattern, so any `.`
 * triggers the guard. Over-guarding costs a UDF call for unusual values; under-guarding returns a
 * wrong answer.
*/
export function needsClassGuard(pattern: string): boolean {
    return /\\[sS]/.test(pattern) || pattern.includes('.') || pattern.includes('[^');
}
/**
 * Whether a pattern's escapes mean the same thing in both engines.
 *
 * `\p{...}` and `\P{...}` are Unicode property escapes in RE2, but in JavaScript only under the `u`
 * flag. Without it `\p` is an identity escape, so `/\p{L}/` matches the literal text `p{L}`.
 * `\u{...}` behaves the same way. Neither errors, so patterns using them keep the UDF.
*/
export function hasPortableEscapes(pattern: string): boolean {
    return !/\\[pP]\{/.test(pattern) && !/\\u\{/.test(pattern);
}
/**
 * Wraps a native regex expression in the per-value class guard, when the pattern needs it.
 *
 * Values the engine differences cannot affect, which is nearly all real text, use the native
 * expression; the rest use the UDF.
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
/** A literal, escaped for use inside an RE2 pattern. */
export function re2Literal(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * How many capture groups a pattern has, or null if JavaScript cannot compile it.
 *
 * `matchAll` collects every group of every match, while `regexp_extract_all` takes one group index,
 * so more than one group has no native form. The count comes from compiling `pattern|`, which
 * matches the empty string and so reports the group count whether or not the pattern itself
 * matches.
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
 * `JS_WHITESPACE` as an RE2 character class, generated from the code points.
 *
 * Several `core-utils` regexes use `\s`, and RE2's `\s` is narrower than JavaScript's (see
 * `RE2_CLASS_DIVERGENCE`). When the pattern is one of ours, copied from `core-utils` rather than
 * supplied by a caller, this class replaces `\s` so the pattern means what it means in JavaScript.
 * Generating it from `JS_WHITESPACE` keeps the two in sync.
*/
export const JS_WHITESPACE_CLASS = `[${[...JS_WHITESPACE]
    .map((char) => `\\x{${char.codePointAt(0)!.toString(16).padStart(2, '0')}}`)
    .join('')}]`;
