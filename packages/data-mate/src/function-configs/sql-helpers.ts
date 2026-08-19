/**
 * Helpers shared by the `sql` emissions on the function configs.
 *
 * These exist so a fact verified once - what JavaScript considers whitespace, how to recognise an
 * ASCII string in SQL - is stated once. Each carries the measurement that justifies it, because
 * every one of them is a divergence the parity gate found rather than a guess.
*/

/**
 * A SQL string literal.
 *
 * Re-exported from the DuckDB layer rather than reimplemented: exactly one function in the
 * codebase should decide how a value becomes a SQL literal.
*/
export { quoteLiteral as sqlLiteral } from '../duck-frame/sql.js';

/**
 * Every code point `String.prototype.trim` strips: ECMAScript `WhiteSpace` + `LineTerminator`.
 *
 * In order: TAB, LF, VT, FF, CR, SPACE, NBSP, then the `Zs` category (OGHAM SPACE MARK, the EN/EM
 * QUAD..HAIR SPACE run, NARROW NO-BREAK SPACE, MEDIUM MATHEMATICAL SPACE, IDEOGRAPHIC SPACE), the
 * two line/paragraph separators, and ZERO WIDTH NO-BREAK SPACE.
 *
 * **DuckDB's one-argument `trim(x)` strips ONLY spaces**, so `trim` cannot be emitted as
 * `trim(x)`:
 * measured, a value of `TAB + " x " + LF` is `"x"` in JavaScript and unchanged in SQL. Passing this
 * set as the second argument makes them agree - verified on all 25 code points individually and in
 * combination.
 *
 * U+0085 (NEL) is deliberately ABSENT: it is category Cc, not `Zs`, so JavaScript does not trim it,
 * and including it made SQL strip a character JavaScript keeps.
*/
export const JS_WHITESPACE = ''
    + '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002'
    + '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f'
    + '\u205f\u3000\ufeff';

/**
 * True when every code point of `value` is below 128.
 *
 * `length()` counts characters and `strlen()` counts bytes, so they agree exactly when the
 * string is ASCII - verified against a real code-point scan. (`octet_length` has no VARCHAR
 * overload, so it cannot be used here.)
 *
 * **This is the guard that makes case conversion promotable at all.** JavaScript uses FULL Unicode
 * case mapping and DuckDB uses simple mapping, so they disagree outside ASCII: `'ß'.toUpperCase()`
 * is `'SS'` in JavaScript and `'ẞ'` in SQL, `'ﬁ'` is `'FI'` and `'ﬁ'`, and `lower('İstanbul')`
 * keeps
 * a combining dot in JavaScript and drops it in SQL. Inside ASCII they agree on all 127 points.
*/
export function isAsciiSql(value: string): string {
    return `strlen(${value}) = length(${value})`;
}

/**
 * `runMathFn`'s contract, in SQL: a non-finite RESULT becomes null.
 *
 * Every numeric transform goes through `runMathFn`, which returns `null` when the result is `NaN` or
 * either infinity - so `sqrt(-1)`, `log(0)` and an overflow all yield null rather than a value or a
 * throw. A bare `sqrt(x)` in SQL would return `nan` or `-inf` instead, which is a different answer.
*/
export function finiteOrNull(expression: string): string {
    return `CASE WHEN isfinite(${expression}) THEN ${expression} ELSE NULL END`;
}

/**
 * A DOUBLE that an `Integer` output can hold.
 *
 * The guard that lets `ceil`/`floor`/`round` be promoted. Their `output_type` is `Integer`, and past
 * that range the UDF path returns a wrapped BIGINT rendered as a STRING (see `docs/known-defects.md`
 * DF2) while the SQL expression returns the true value - so inside the range SQL is used, and outside
 * it the UDF is, which keeps the answer bit-identical to today at magnitudes no real dataset holds.
 *
 * `+ 0` normalises `-0` to `0`, which is what the UDF path's conversion does.
*/
export function withinIntegerRange(value: string, native: string): string {
    return `CASE WHEN abs(${value}) <= 2147483647 THEN ${native} + 0`;
}

/**
 * Values whose reversal needs GRAPHEME segmentation, as an RE2 class.
 *
 * The same set as `reverse.ts`'s `NEEDS_SEGMENTATION`: an astral code point, a zero-width joiner, or
 * a combining mark. Verified that RE2 supports all three forms and matches the same strings as the
 * JavaScript regex - `'éabc'`, `'👍'` and a ZWJ sequence match, plain ASCII does not.
*/
export const NEEDS_GRAPHEME_REVERSE = '[\\p{M}\\x{200D}\\x{10000}-\\x{10FFFF}]';

/**
 * A domain guard, because **DuckDB THROWS where JavaScript returns NaN**.
 *
 * Measured: `sqrt(-1)` is `Out of Range Error: cannot take square root of a negative number`, and
 * `ln(0)` and `ln(-1)` raise their own errors - while `Math.sqrt(-1)` is `NaN` and `runMathFn` turns
 * that into `null`. So a bare native call is not merely a different answer for out-of-domain input,
 * it aborts the whole query. The guard has to come BEFORE the call, not after it, which is why
 * `finiteOrNull` cannot do this job.
*/
export function inDomain(condition: string, native: string): string {
    return `CASE WHEN ${condition} THEN ${native} ELSE NULL END`;
}

/**
 * Values that contain a code point outside the BMP, as an RE2 class.
 *
 * **The guard for every function whose JavaScript implementation counts UTF-16 CODE UNITS while SQL
 * counts CHARACTERS.** `truncate` with size 3 over four thumbs-up emoji returns `'\u{1F44D}\ud83d'`
 * in JavaScript - a lone surrogate - where `substring` returns three whole emoji; `isLength` with
 * size 5 calls five emoji a length of 10. Neither is expressible in SQL, and both are correct
 * according to the current behaviour, so astral input goes to the UDF and everything else - which is
 * all real data - stays native.
*/
export const HAS_ASTRAL = '[\\x{10000}-\\x{10FFFF}]';

/**
 * True for an argument that can be spliced into SQL as a numeric literal.
 *
 * **The guard for a whole class of emission, and it is not theoretical.** `subtract` declares no
 * `required_arguments`, so a call with no `value` reaches the emission as `undefined`,
 * `Number(undefined)` is `NaN`, and `NaN` splices in as a BARE IDENTIFIER: DuckDB answers
 * `Binder Error: Referenced column "NaN" not found in FROM clause`, aborting the query, where the
 * UDF path quietly returns `NaN` for every row. `Infinity` fails the same way. An argument that is
 * not a finite number therefore keeps the UDF, which is exactly what `applies` is for.
*/
function isNumericArg(value: unknown): boolean {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * An `applies` for an emission that splices these arguments in as numbers and needs all of them.
 *
 * Use for a function whose argument is genuinely required - `add`, `pow`, `truncate`. `subtract` is
 * in this group despite not DECLARING the argument required, because its emission cannot express
 * the missing case.
*/
export function needsNumericArgs<T extends Record<string, any>>(
    ...names: readonly string[]
): (args: T) => boolean {
    return (args) => names.every((name) => isNumericArg(args[name]));
}

/**
 * An `applies` for an emission where the arguments are OPTIONAL but must be numbers when present.
 *
 * `inNumberRange` and `isLength` already build their expression from whichever bounds they were
 * given, so absence is fine and only a present non-number is a problem.
*/
export function allowsNumericArgs<T extends Record<string, any>>(
    ...names: readonly string[]
): (args: T) => boolean {
    return (args) => names.every((name) => args[name] == null || isNumericArg(args[name]));
}
