import { TSError, isString } from '@terascope/core-utils';
import { SortOrder, SQLNullOrder, SQLSort } from '@terascope/types';

/**
 * The clauses that follow a `SELECT` list.
 *
 * Every package that generates SQL builds `ORDER BY` here, so null placement is the same
 * everywhere.
*/

/**
 * Validate a sort direction and return `ASC` or `DESC`.
 *
 * The value comes from the request and is written into the statement as a keyword, so it is
 * checked at runtime to prevent SQL injection.
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
 * Where nulls go when the sort does not say.
 *
 * This follows `DataFrame`, which treats null as the smallest value: nulls come first when
 * ascending and last when descending. No engine's default matches:
 *
 * | | ascending | descending |
 * |---|---|---|
 * | Elasticsearch (`missing` defaults to `_last`) | last | last |
 * | DuckDB (`default_null_order`) | last | last |
 * | PostgreSQL (a null is the largest value) | last | first |
 * | **`DataFrame` - what this returns** | **first** | **last** |
 *
 * So {@link orderByTerms} writes `NULLS FIRST` or `NULLS LAST` on every term. To get
 * Elasticsearch's behavior, pass `nulls: 'last'` on the sort.
*/
export function defaultNullOrder(direction: 'ASC' | 'DESC'): SQLNullOrder {
    return direction === 'DESC' ? 'last' : 'first';
}

/**
 * One `ORDER BY` term, such as `<expression> ASC NULLS FIRST`.
 *
 * The expression is SQL and is used as-is (a `geoDistance` sort is a function call), so a
 * field name from a request must be wrapped with `dialect.fieldRef(field)` first. The
 * direction and null placement are validated.
*/
function orderByTerm(sort: SQLSort): string {
    const { expression, order, nulls } = sort;

    if (!expression) {
        throw new TSError('An ORDER BY term requires an expression', {
            statusCode: 400,
            context: { safe: true }
        });
    }

    // use the normalized direction for the null default, so `'DESC'` and `'desc'` agree
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
 * Each entry is raw SQL, like an `ORDER BY` expression, so `date_trunc('day', ts)` is a
 * valid grouping key.
*/
export function groupByClause(groupBy?: readonly string[]): string {
    if (!groupBy?.length) return '';
    return `GROUP BY ${groupBy.join(', ')}`;
}

/**
 * A sort term whose direction is optional, for code that calls a frame's `orderBy`.
 *
 * {@link SQLSort} requires a direction because it is built from request data. Code calling
 * `orderBy` directly can omit it, and {@link toSQLSort} defaults it to ascending, as
 * `DataFrame.orderBy` does. Any `SQLSort` is also a valid `SQLSortInput`.
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

/** The joins a statement can make, as {@link joinClause} takes them. */
export type SQLJoinType = 'inner' | 'left' | 'right' | 'full' | 'cross';

const JOIN_TYPES = ['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'] as const;

/**
 * Validate a join type and return it as its keyword.
 *
 * The type is written into the statement as a keyword, so it is checked at runtime, like
 * {@link sortDirection}.
*/
export function joinType(value: unknown): typeof JOIN_TYPES[number] {
    const type = isString(value) ? value.toUpperCase() : undefined;
    const found = JOIN_TYPES.find((joinKeyword) => joinKeyword === type);

    if (found == null) {
        throw new TSError(`Expected a join type of inner, left, right, full or cross, got ${value}`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return found;
}

/**
 * A `JOIN` clause, such as `LEFT JOIN <relation> ON <condition>`.
 *
 * The relation and the condition are SQL and are used as-is, like an `ORDER BY` expression:
 * the relation is usually an aliased table or subquery (`"child" AS "c"`), and the condition
 * refers to the aliases. A cross join takes no condition; every other join requires one.
*/
export function joinClause(type: SQLJoinType, relation: string, on?: string): string {
    const keyword = joinType(type);

    if (!relation?.trim()) {
        throw new TSError('A join requires a relation', {
            statusCode: 400,
            context: { safe: true }
        });
    }

    if (keyword === 'CROSS') {
        if (on != null) {
            throw new TSError('A CROSS JOIN does not take a condition', {
                statusCode: 400,
                context: { safe: true }
            });
        }
        return `CROSS JOIN ${relation}`;
    }

    if (!on?.trim()) {
        throw new TSError(`${keyword === 'INNER' ? 'An' : 'A'} ${keyword} JOIN requires a condition`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return `${keyword} JOIN ${relation} ON ${on}`;
}
