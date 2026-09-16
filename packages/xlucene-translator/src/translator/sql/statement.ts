import { TSError } from '@terascope/core-utils';
import { SQLDialect, SQLSearchParams, SQLSort } from '@terascope/types';
import { quoteIdentifier } from './helpers.js';
import { toOrderBy } from './translate.js';

/**
 * The pieces of a statement, before they are one.
 *
 * `QueryAccess.restrictSQLParts` returns this for a caller composing their own statement - a
 * frame that already knows its relation, say. Anyone who wants the statement itself should
 * use `restrictSQLQuery` and never see this.
*/
export interface SQLQueryParts {
    /** The `SELECT` list, with the field restrictions already applied. */
    select: string;
    /** The `WHERE` expression. */
    where: string;
    /** The ordering the query itself asked for, if any. */
    sort?: SQLSort[];
    /** The field paths `select` projects. */
    columns: string[];
    /** The lists Elasticsearch would have been sent. NOT column names. */
    includes?: string[];
    excludes?: string[];
}

/**
 * A complete, executable SQL statement.
 *
 * This is the SQL counterpart of what `restrictSearchQuery` hands back: something a client can
 * be given as-is. **It exists so that no caller has to concatenate a statement**, because the
 * pieces a caller forgets are the field restrictions - and forgetting those means a restricted
 * column reaches whoever asked.
*/
export function buildSQLStatement(
    parts: SQLQueryParts,
    params: SQLSearchParams,
    dialect: SQLDialect
): string {
    const statement = [
        `SELECT ${parts.select}`,
        `FROM ${relationOf(params)}`,
    ];

    // `WHERE TRUE` is valid and says nothing; a query that restricts nothing gets no clause
    if (parts.where !== dialect.matchAll()) {
        statement.push(`WHERE ${parts.where}`);
    }

    /**
     * The query's own ordering comes first, matching `restrictSearchQuery`, where the
     * translated `sort` is spread over the caller's.
    */
    const orderBy = toOrderBy([...(parts.sort ?? []), ...(params.sort ?? [])]);
    if (orderBy) statement.push(`ORDER BY ${orderBy}`);

    const limit = dialect.limitOffset(params.size, params.from);
    if (limit) statement.push(limit);

    return statement.join(' ');
}

/**
 * What the statement selects from.
 *
 * `table` is quoted a segment at a time, so `main.events` is a schema and a table rather than
 * anything the name could otherwise be read as; `relation` is the caller's own SQL and is used
 * verbatim. One or the other is required - there is no statement without a source, and
 * defaulting to one would be a guess about somebody's schema.
*/
function relationOf(params: SQLSearchParams): string {
    const { table, relation } = params;

    if (table != null && relation != null) {
        throw new TSError('Specify either a table or a relation to select from, not both', {
            statusCode: 400,
            context: { safe: true }
        });
    }

    if (relation != null) return relation;

    if (table == null || table === '') {
        throw new TSError('A table or relation is required to build a SQL statement', {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return table.split('.').map(quoteIdentifier)
        .join('.');
}
