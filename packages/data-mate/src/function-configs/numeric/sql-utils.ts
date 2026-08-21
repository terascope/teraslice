import { FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../interfaces.js';

/**
 * Helpers shared by the `sql` emissions on the numeric function configs.
*/

/**
 * True when the column really is an array, which is the only shape the `*Values` reducers fold.
 *
 * They are `FULL_VALUES` functions that return a scalar column's value UNCHANGED - `addValuesFn`
 * short-circuits on a number - and `list_sum` of a scalar is not an expression at all. So the
 * emission claims the array column and the scalar one keeps the UDF, where it costs one call per
 * row and returns the row.
*/
export function isArrayColumn(_args: unknown, inputConfig?: DataTypeFieldAndChildren): boolean {
    return inputConfig?.field_config?.array === true;
}

/** The list with its nulls removed - what every one of the reducers folds over. */
function withoutNulls(value: string): string {
    return `list_filter(${value}, lambda x : x IS NOT NULL)`;
}

/**
 * A left fold over the non-null elements, or NULL when there are none.
 *
 * **The emptiness guard is not defensive, it is required.** Measured: `list_reduce` over an empty
 * list raises `Parameter Not Allowed Error: Cannot perform list_reduce on an empty input list`,
 * where the JavaScript reducer starts from `null` and simply returns `null` - so an all-null array,
 * or an empty one, would abort the query instead of producing a null.
 *
 * `lambda a, b : ...` rather than `(a, b) -> ...`: the single-arrow form is disabled by default in
 * DuckDB v2.0 and removed in v2.1.
*/
export function foldList(value: string, operator: string): string {
    const list = withoutNulls(value);
    return `CASE WHEN len(${list}) = 0 THEN NULL`
        + ` ELSE list_reduce(${list}, lambda a, b : a ${operator} b) END`;
}

/**
 * The numeric field types `setPrecision`'s emission claims - where rounding means anything.
 *
 * An `Integer`/`Long`/`Byte`/`Short` column is already whole, so `setPrecision` is identity there -
 * but `validateAccepts` treats `[Number]` as every numeric width, so `types` cannot express this
 * and an `applies` has to.
*/
export const FRACTIONAL_FIELD_TYPES: readonly string[] = [
    FieldType.Number, FieldType.Float, FieldType.Double,
];

/**
 * `parseFloat(value.toFixed(digits))`, in SQL - and **`round()` is not it**.
 *
 * Measured over 84 value/digit pairs (`docs/tools/probe/group-a-candidates.mjs`):
 *
 * - **`round(2.675, 2)` is `2.68` and `toFixed(2)` is `'2.67'`.** `toFixed` rounds the value's
 *   EXACT binary expansion, which is 2.67499999999999982..., while `round` rounds the decimal it
 *   looks like. One divergence in 84, on the shape money takes, so `round` is out.
 * - **`CAST(v AS DECIMAL(38, d))` gets it wrong the same way** - also 2.68 - so the decimal cast is
 *   out too, and it throws on `nan` and overflows above 10^38 besides.
 * - **`printf('%.{d}f', v)` works on the exact value, like `toFixed`.** Over the same 84 pairs
 *   plus
 *   12 exact ties it agrees everywhere but the ties: `printf` rounds half to EVEN and `toFixed`
 *   rounds half AWAY FROM ZERO, so `%.0f` of 2.5 is `2` where `toFixed(0)` is `'3'`.
 *
 * Hence the guard, and it is exact rather than conservative-in-name-only: a tie means the exact
 * value terminates at digit `d + 1` with a `5`, so rendering at `d + 1` digits and finding
 * something other than `5` at the end PROVES it is not a tie - and away from a tie the two
 * roundings cannot differ. Non-finite input keeps the UDF too, because `setPrecision` returns `NaN`
 * and the infinities unchanged and `printf` renders them as the text `nan`/`inf`.
*/
export function toFixedSql(value: string, digits: number): string {
    return `CAST(printf('%.${digits}f', ${value}) AS DOUBLE)`;
}

/** True when `printf` at `digits` is guaranteed to agree with `toFixed` - see `toFixedSql`. */
export function notAtRoundingTie(value: string, digits: number): string {
    return `isfinite(${value}) AND right(printf('%.${digits + 1}f', ${value}), 1) <> '5'`;
}

/**
 * `truncateNumber`, in SQL: render at `digits + 5`, then KEEP the first `digits` decimals.
 *
 * A transliteration of the JavaScript rather than `trunc(v * 10^d) / 10^d`, which is wrong -
 * `8.29 * 100` is 828.99999999999989, so truncating the product gives 8.28 where the function gives
 * 8.29. Agreed with `truncateNumber` on all 84 pairs. The `digits + 5` rendering can itself land on
 * a tie whose rounding cascades into the kept digits, so it carries the same guard.
*/
export function truncateToDigitsSql(value: string, digits: number): string {
    const rendered = `printf('%.${digits + 5}f', ${value})`;
    if (digits === 0) return `CAST(split_part(${rendered}, '.', 1) AS DOUBLE)`;
    return `CAST(split_part(${rendered}, '.', 1) || '.'`
        + ` || substring(split_part(${rendered}, '.', 2), 1, ${digits}) AS DOUBLE)`;
}
