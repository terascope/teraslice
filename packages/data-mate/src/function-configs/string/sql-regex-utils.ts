import { HAS_ASTRAL, JS_WHITESPACE, sqlLiteral } from '../sql-helpers.js';

/**
 * Where DuckDB's RE2 and JavaScript's regex engine part company.
 *
 * Split out of `sql-utils.ts` because it is a subject in its own right, and because getting it
 * half-right cost an already-promoted function a silent wrong answer - `docs/known-defects.md`
 * DF10. **Compiling is not matching:** RE2 refusing a construct is loud, RE2 accepting one and
 * meaning something else is not.
*/
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
/** A literal, escaped for use inside an RE2 pattern. */
export function re2Literal(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * `JS_WHITESPACE` as an RE2 character class, built from the code points rather than typed.
 *
 * **The reason this exists is `\s`.** Several `core-utils` regexes use `\s`, and RE2's `\s` is only
 * `[\t\n\f\r ]` where JavaScript's takes 20 more (see `RE2_CLASS_DIVERGENCE`). Where the
 * pattern is one of OURS - transliterated from `core-utils`, not supplied by a caller - the right
 * answer is not to guard the value but to write the class JavaScript actually means. Generated from
 * `JS_WHITESPACE` so the two can never drift.
*/
export const JS_WHITESPACE_CLASS = `[${[...JS_WHITESPACE]
    .map((char) => `\\x{${char.codePointAt(0)!.toString(16).padStart(2, '0')}}`)
    .join('')}]`;
