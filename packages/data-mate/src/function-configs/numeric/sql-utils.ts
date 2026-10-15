import { FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../interfaces.js';

/**
 * Helpers shared by the SQL expressions on the numeric function configs.
*/

/**
 * True when the column is an array, the only shape the `*Values` reducers fold.
 *
 * On a scalar column these functions return the value unchanged, and `list_sum` of a scalar is
 * not valid SQL, so scalar columns keep the UDF.
*/
export function isArrayColumn(_args: unknown, inputConfig?: DataTypeFieldAndChildren): boolean {
    return inputConfig?.field_config?.array === true;
}

/** The list with its nulls removed, which is what the reducers fold over. */
function withoutNulls(value: string): string {
    return `list_filter(${value}, lambda x : x IS NOT NULL)`;
}

/**
 * A left fold over the non-null elements, or NULL when there are none.
 *
 * The empty check is required: `list_reduce` raises an error on an empty list, while the
 * JavaScript reducer returns `null`.
 *
 * Uses `lambda a, b : ...` because the `(a, b) -> ...` form is disabled by default in DuckDB
 * v2.0 and removed in v2.1.
*/
export function foldList(value: string, operator: string): string {
    const list = withoutNulls(value);
    return `CASE WHEN len(${list}) = 0 THEN NULL`
        + ` ELSE list_reduce(${list}, lambda a, b : a ${operator} b) END`;
}

/**
 * The numeric field types `setPrecision` handles in SQL: the ones that can hold a fraction.
 *
 * `validateAccepts` treats `[Number]` as every numeric width, so `types` cannot exclude the
 * integer types and `applies` checks this list instead.
*/
export const FRACTIONAL_FIELD_TYPES: readonly string[] = [
    FieldType.Number, FieldType.Float, FieldType.Double,
];

/**
 * `parseFloat(value.toFixed(digits))` in SQL.
 *
 * `toFixed` rounds the value's exact binary expansion, so `(2.675).toFixed(2)` is `'2.67'`
 * (the stored value is 2.67499999...). DuckDB's `round(2.675, 2)` and a `DECIMAL` cast both give
 * `2.68`. `printf('%.{d}f', v)` also rounds the exact value and agrees with `toFixed` except at
 * exact ties, where `printf` rounds half to even and `toFixed` rounds half away from zero
 * (`%.0f` of 2.5 is `2`, `toFixed(0)` is `'3'`).
 *
 * `notAtRoundingTie` excludes those ties. A tie means the exact value ends with a `5` at digit
 * `d + 1`, so if the rendering at `d + 1` digits does not end in `5` it is not a tie and the two
 * roundings agree. Non-finite values also keep the UDF, because `setPrecision` returns them
 * unchanged and `printf` renders them as `nan`/`inf`.
*/
export function toFixedSql(value: string, digits: number): string {
    return `CAST(printf('%.${digits}f', ${value}) AS DOUBLE)`;
}

/** True when `printf` at `digits` is guaranteed to agree with `toFixed` - see `toFixedSql`. */
export function notAtRoundingTie(value: string, digits: number): string {
    return `isfinite(${value}) AND right(printf('%.${digits + 1}f', ${value}), 1) <> '5'`;
}

/**
 * `truncateNumber` in SQL: render at `digits + 5` decimals, then keep the first `digits`.
 *
 * `trunc(v * 10^d) / 10^d` would be wrong: `8.29 * 100` is 828.99999999999989, so it gives 8.28
 * where `truncateNumber` gives 8.29. The `digits + 5` rendering can itself round up at a tie and
 * change the kept digits, so callers apply the same `notAtRoundingTie` guard.
*/
export function truncateToDigitsSql(value: string, digits: number): string {
    const rendered = `printf('%.${digits + 5}f', ${value})`;
    if (digits === 0) return `CAST(split_part(${rendered}, '.', 1) AS DOUBLE)`;
    return `CAST(split_part(${rendered}, '.', 1) || '.'`
        + ` || substring(split_part(${rendered}, '.', 2), 1, ${digits}) AS DOUBLE)`;
}
