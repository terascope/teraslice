/**
 * Throws if an operation would silently discard the frame's ordering. Used by `TealFrame`'s
 * `join`, `distinct` and aggregating `select`.
 *
 * SQL does not guarantee that a subquery's `ORDER BY` survives the outer query. In DuckDB a
 * projection, `WHERE`, `LIMIT` or `OFFSET` keeps the order, but a hash join or hash aggregate
 * reorders rows. This only shows once the data is large enough to run in parallel (small
 * inputs come out ordered), so it is easy to miss in tests. Sort the result instead.
 *
 * A global aggregate written directly into `select`'s expressions with no `groupBy`
 * (`{ total: 'sum(x)' }`) is not detected, because the expressions are raw SQL. It returns
 * one row, so the ordering does not matter.
*/
export function assertOrderSafe(operation: string, ordered: boolean): void {
    if (!ordered) return;

    throw new TypeError(
        `${operation} reorders rows, so this frame's ORDER BY would be silently discarded`
        + ' (a join or GROUP BY does not preserve the order of its input once DuckDB runs it'
        + ' in parallel). Sort the result instead.'
    );
}
