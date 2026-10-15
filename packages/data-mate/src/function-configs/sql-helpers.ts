import { FieldType } from '@terascope/types';
// imported as well as re-exported: `primitiveLiteral` below needs it as a local binding
import { quoteLiteral } from '@terascope/sql-builder';

/**
 * Helpers shared by the `sql` expressions on the function configs.
 *
 * Each one handles a place where DuckDB and JavaScript behave differently, so the fix is written
 * once.
*/

/**
 * A SQL string literal. Re-exported from `@terascope/sql-builder` so that one function decides how
 * a value becomes a literal.
*/
export { quoteLiteral as sqlLiteral } from '@terascope/sql-builder';

/**
 * Every code point `String.prototype.trim` strips: ECMAScript `WhiteSpace` and `LineTerminator`.
 *
 * In order: TAB, LF, VT, FF, CR, SPACE, NBSP, the `Zs` category (OGHAM SPACE MARK, EN QUAD through
 * HAIR SPACE, NARROW NO-BREAK SPACE, MEDIUM MATHEMATICAL SPACE, IDEOGRAPHIC SPACE), the line and
 * paragraph separators, and ZERO WIDTH NO-BREAK SPACE.
 *
 * DuckDB's one-argument `trim(x)` strips only spaces, so `TAB + " x " + LF` is `"x"` in
 * JavaScript and unchanged in SQL. Passing this set as the second argument makes them agree.
 *
 * U+0085 (NEL) is left out on purpose: it is category Cc, so JavaScript does not trim it.
*/
export const JS_WHITESPACE = ''
    + '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002'
    + '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f'
    + '\u205f\u3000\ufeff';

/**
 * True when every code point of `value` is below 128.
 *
 * `length()` counts characters and `strlen()` counts bytes, so they are equal exactly when the
 * string is ASCII. (`octet_length` has no VARCHAR overload.)
 *
 * Case conversion depends on this guard. JavaScript uses full Unicode case mapping and DuckDB uses
 * simple mapping, so they disagree outside ASCII: `'ß'.toUpperCase()` is `'SS'` in JavaScript and
 * `'ẞ'` in SQL, and `lower('İstanbul')` keeps a combining dot in JavaScript but drops it in SQL.
 * Within ASCII they agree.
*/
export function isAsciiSql(value: string): string {
    return `strlen(${value}) = length(${value})`;
}

/**
 * `runMathFn`'s rule in SQL: a non-finite result becomes null.
 *
 * Every numeric transform goes through `runMathFn`, which returns null when the result is `NaN` or
 * infinite, so `log(0)` and an overflow give null. A bare SQL call could return `nan` or `-inf`
 * instead.
*/
export function finiteOrNull(expression: string): string {
    return `CASE WHEN isfinite(${expression}) THEN ${expression} ELSE NULL END`;
}

/**
 * Starts a `CASE` that uses `native` when `value` fits in an `Integer` output. The caller adds
 * the `ELSE` branch.
 *
 * Used by `ceil`, `floor` and `round`, whose `output_type` is `Integer`. Outside that range the
 * UDF path returns a BIGINT rendered as a string while SQL returns the true value, so those values
 * go to the UDF to keep the results identical.
 *
 * `+ 0` turns `-0` into `0`, as the UDF path's conversion does.
*/
export function withinIntegerRange(value: string, native: string): string {
    return `CASE WHEN abs(${value}) <= 2147483647 THEN ${native} + 0`;
}

/**
 * Values whose reversal needs grapheme segmentation, as an RE2 class: an astral code point, a
 * zero-width joiner, or a combining mark. The same set as `NEEDS_SEGMENTATION` in `reverse.ts`.
*/
export const NEEDS_GRAPHEME_REVERSE = '[\\p{M}\\x{200D}\\x{10000}-\\x{10FFFF}]';

/**
 * Returns null instead of calling `native` when `condition` is false.
 *
 * DuckDB throws where JavaScript returns NaN: `sqrt(-1)` raises `Out of Range Error`, and `ln(0)`
 * and `ln(-1)` raise errors too, while `Math.sqrt(-1)` is `NaN` and `runMathFn` turns it into
 * null. An unguarded call would abort the query, so the check must come before the call.
 * `finiteOrNull` checks the result afterwards, which is too late.
*/
export function inDomain(condition: string, native: string): string {
    return `CASE WHEN ${condition} THEN ${native} ELSE NULL END`;
}

/**
 * Values that contain a code point outside the BMP, as an RE2 class.
 *
 * A guard for functions whose JavaScript implementation counts UTF-16 code units while SQL counts
 * characters. `truncate` with size 3 over four thumbs-up emoji returns `'\u{1F44D}\ud83d'` (one
 * emoji and a lone surrogate) in JavaScript, where `substring` returns three whole emoji.
 * `isLength` with size 5 counts five emoji as length 10. SQL cannot reproduce either, so astral
 * input goes to the UDF.
*/
export const HAS_ASTRAL = '[\\x{10000}-\\x{10FFFF}]';

/**
 * True for an argument that can be inserted into SQL as a numeric literal.
 *
 * `subtract` declares no `required_arguments`, so a call without `value` reaches the expression as
 * `undefined`. `Number(undefined)` is `NaN`, which would be inserted as a bare identifier and fail
 * with `Binder Error: Referenced column "NaN" not found`, while the UDF path returns `NaN` for
 * every row. `Infinity` fails the same way, so a non-finite argument keeps the UDF.
*/
function isNumericArg(value: unknown): boolean {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * An `applies` for an expression that inserts all of these arguments as numbers.
 *
 * Use it when the arguments are required, as for `add`, `pow` and `truncate`. `subtract` uses it
 * too: it does not declare its argument required, but its expression cannot handle a missing one.
*/
export function needsNumericArgs<T extends Record<string, any>>(
    ...names: readonly string[]
): (args: T) => boolean {
    return (args) => names.every((name) => isNumericArg(args[name]));
}

/**
 * An `applies` for optional arguments that must be numbers when present.
 *
 * `inNumberRange` and `isLength` build their expression from whichever bounds were given, so only
 * a present non-number is a problem.
*/
export function allowsNumericArgs<T extends Record<string, any>>(
    ...names: readonly string[]
): (args: T) => boolean {
    return (args) => names.every((name) => args[name] == null || isNumericArg(args[name]));
}

/** The string-shaped field types, as `validateAccepts` treats them. */
export const STRING_FIELD_TYPES: readonly FieldType[] = [
    FieldType.String, FieldType.Keyword, FieldType.Text, FieldType.NgramTokens,
];

/** The numeric field types. */
export const NUMERIC_FIELD_TYPES: readonly FieldType[] = [
    FieldType.Number,
    FieldType.Byte,
    FieldType.Short,
    FieldType.Integer,
    FieldType.Long,
    FieldType.Float,
    FieldType.Double,
];

/**
 * A SQL literal for an argument declared `FieldType.Any`, or null when it has none.
 *
 * `setDefault` and `equals` take any value, but only primitives have a literal form. An object or
 * array would need the structural comparison that `isDeepEqual` does, so it keeps the UDF; the
 * caller's `applies` checks for null.
*/
export function primitiveLiteral(value: unknown): string | null {
    if (typeof value === 'string') return quoteLiteral(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
}

/**
 * Whether a `FieldType.Any` argument is the same kind of value as the column it is compared or
 * coalesced with.
 *
 * SQL allows mixing them (`coalesce(varchar_col, 5)` casts), but DuckDB's cast and JavaScript's
 * may not turn `5` into the same string. Only same-kind pairs run as SQL; the rest keep the UDF.
*/
export function literalMatchesColumn(value: unknown, type: FieldType): boolean {
    if (typeof value === 'string') return STRING_FIELD_TYPES.includes(type);
    if (typeof value === 'boolean') return type === FieldType.Boolean;
    if (typeof value === 'number') return NUMERIC_FIELD_TYPES.includes(type);
    return false;
}
