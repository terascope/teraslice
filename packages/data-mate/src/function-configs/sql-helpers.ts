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
