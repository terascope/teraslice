/**
 * Refuses an operation that would silently discard an ordering - `TealFrame`'s `join`, `distinct`
 * and an aggregating `select`.
 *
 * **Measured at 5M rows / 14 threads**, counting
 * out-of-order rows in the streamed output of a subquery that ends in `ORDER BY x`:
 *
 * | outer operator | out of order |
 * |---|---|
 * | projection, `WHERE`, `LIMIT`, `OFFSET` | **0** - order preserved |
 * | `JOIN` | 303 |
 * | `GROUP BY` | 2,104 |
 *
 * SQL promises nothing about a subquery's `ORDER BY`, and DuckDB's hash join and hash
 * aggregate both reorder. **The same two queries come out perfectly ordered at 20 rows**,
 * so this is a bug that appears only once the data is large enough to be parallelised -
 * exactly the kind that reaches production. Hence a throw rather than a silent drop.
 *
 * Sorting last is the real shape anyway: QPL emits `orderBy` as a POST-aggregate node.
 *
 * **What this cannot catch:** a global aggregate written into `select`'s expressions with
 * no `groupBy` (`{ total: 'sum(x)' }`) also reorders, but the expressions are raw SQL, so
 * there is nothing to inspect. Its result is one row, which makes the ordering moot.
*/
export function assertOrderSafe(operation: string, ordered: boolean): void {
    if (!ordered) return;

    throw new TypeError(
        `${operation} reorders rows, so this frame's ORDER BY would be silently discarded`
        + ' - measured: a subquery ORDER BY survives a projection or a filter, but comes'
        + ' out of a join or a GROUP BY scrambled, and only once the data is big enough to'
        + ' be parallelised. Sort the RESULT instead.'
    );
}
