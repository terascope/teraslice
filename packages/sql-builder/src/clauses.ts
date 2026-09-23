import { TSError, isString } from '@terascope/core-utils';
import { SortOrder, SQLNullOrder, SQLSort } from '@terascope/types';

/**
 * The clauses that follow a `SELECT` list.
 *
 * **Every SQL-emitting package in the repo renders `ORDER BY` from here**, because null
 * placement is a behaviour and two copies of a behaviour drift. Before this existed,
 * `xlucene-translator` emitted `x ASC` and let DuckDB's `default_null_order` decide, while
 * `data-mate`'s DuckDB frame emitted `x ASC NULLS FIRST` - so the same user query sorted one
 * way through a translated statement and the other way through the frame's own `orderBy`.
*/

/**
 * A sort direction, which is `ASC` or `DESC` and nothing else.
 *
 * `SQLSort.order` is TYPED as a `SortOrder`, and a type is not a check: the value arrives
 * from a caller's request and goes into the statement as a keyword, which makes checking it
 * the difference between an ordering and an injection point.
*/
export function sortDirection(value: unknown): 'ASC' | 'DESC' {
    const order = isString(value) ? value.toUpperCase() : undefined;

    if (order !== 'ASC' && order !== 'DESC') {
        throw new TSError(`Expected a sort order of asc or desc, got ${value}`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return order;
}

/**
 * Where nulls go, when the sort did not say.
 *
 * **This follows `DataFrame`, and it agrees with no engine's default.** `Vector.compare`
 * treats a nil as the SMALLEST value, so nulls come FIRST ascending and LAST descending.
 * The three defaults that are NOT this:
 *
 * | | ascending | descending |
 * |---|---|---|
 * | Elasticsearch (`missing` defaults to `_last`) | last | last |
 * | DuckDB (`default_null_order`) | last | last |
 * | PostgreSQL (a null is the largest value) | last | first |
 * | **`DataFrame` - what this returns** | **first** | **last** |
 *
 * Since it matches nothing, it can never be left to a default: {@link orderByTerms} emits
 * `NULLS FIRST` or `NULLS LAST` on EVERY term, in every engine. A caller that wants the
 * Elasticsearch answer passes `nulls: 'last'` on the sort.
*/
export function defaultNullOrder(direction: 'ASC' | 'DESC'): SQLNullOrder {
    return direction === 'DESC' ? 'last' : 'first';
}

/**
 * One `ORDER BY` term - `<expression> ASC NULLS FIRST`.
 *
 * The expression is used VERBATIM, because it is the caller's own SQL: a `geoDistance` sort
 * is a function call, and nothing that could validate an expression would still admit one. A
 * field name arriving from a request wants `dialect.fieldRef(field)` around it first.
 *
 * The direction and the null placement are the opposite case - each is one of two keywords,
 * each arrives from a request as a value rather than as SQL, and each is checked.
*/
function orderByTerm(sort: SQLSort): string {
    const { expression, order, nulls } = sort;

    if (!expression) {
        throw new TSError('An ORDER BY term requires an expression', {
            statusCode: 400,
            context: { safe: true }
        });
    }

    // the NORMALISED direction decides the null default, not the raw value: `'DESC'` is a
    // legal spelling of `desc` and comparing the raw value would have sorted its nulls as
    // though it were ascending
    const direction = sortDirection(order);
    const nullOrder = nulls ?? defaultNullOrder(direction);

    if (nullOrder !== 'first' && nullOrder !== 'last') {
        throw new TSError(`Expected a null order of first or last, got ${nulls}`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return `${expression} ${direction} NULLS ${nullOrder.toUpperCase()}`;
}

/** The comma-separated `ORDER BY` terms, without the keyword, or `''` for no ordering. */
export function orderByTerms(sort?: readonly SQLSort[]): string {
    if (!sort?.length) return '';
    return sort.map(orderByTerm).join(', ');
}

/** A complete `ORDER BY` clause, or `''` when the query asked for no ordering. */
export function orderByClause(sort?: readonly SQLSort[]): string {
    const terms = orderByTerms(sort);
    return terms ? `ORDER BY ${terms}` : '';
}

/**
 * A complete `GROUP BY` clause, or `''`.
 *
 * Each entry is raw SQL exactly as an `ORDER BY` expression is, so `date_trunc('day', ts)`
 * is a valid grouping key.
*/
export function groupByClause(groupBy?: readonly string[]): string {
    if (!groupBy?.length) return '';
    return `GROUP BY ${groupBy.join(', ')}`;
}

/**
 * A sort as a FRAME's caller writes one, where the direction may be left out.
 *
 * {@link SQLSort} requires the direction because it is built from request data, where a
 * missing one is a bug rather than a shorthand. A frame's own `orderBy` is the other case -
 * it is called from code, `DataFrame.orderBy` has always defaulted to ascending, and
 * `.orderBy([{ expression: '"name"' }])` means exactly one thing. {@link toSQLSort} applies
 * that default, so the strictness lives where the data is untrusted and the convenience
 * where it is not.
 *
 * A `SQLSort` is assignable to this, which is the point: a translated sort can be handed
 * straight to a frame.
*/
export interface SQLSortInput {
    expression: string;
    order?: SortOrder;
    nulls?: SQLNullOrder;
}

/** A frame's sort term as a complete {@link SQLSort}, defaulting the direction to ascending. */
export function toSQLSort(sort: SQLSortInput): SQLSort {
    return { ...sort, order: sort.order ?? 'asc' };
}
