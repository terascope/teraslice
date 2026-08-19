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
