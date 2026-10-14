import { TSError } from '@terascope/core-utils';
import { SQLDialect, SQLSearchParams, SQLSort } from '@terascope/types';
import { quoteIdentifier } from './quoting.js';

/**
 * The parts of a SQL statement, before they are joined.
 *
 * `QueryAccess.restrictSQLParts` returns this for callers that build their own statement,
 * such as a frame that already has its relation. Use `restrictSQLQuery` to get a complete
 * statement instead.
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
    /** The `_source` include/exclude lists Elasticsearch would receive, not column names. */
    includes?: string[];
    excludes?: string[];
}

/**
 * Build a complete, executable SQL statement from its parts.
 *
 * This is the SQL counterpart of `restrictSearchQuery`. Callers should use it rather than
 * joining the parts themselves, since leaving out `select` would return restricted columns.
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

    // skip the clause when the query matches everything
    if (parts.where !== dialect.matchAll()) {
        statement.push(`WHERE ${parts.where}`);
    }

    // the query's own sort comes before the caller's, as in `restrictSearchQuery`
    const orderBy = dialect.orderBy([...(parts.sort ?? []), ...(params.sort ?? [])]);
    if (orderBy) statement.push(`ORDER BY ${orderBy}`);

    const limit = dialect.limitOffset(params.size, params.from);
    if (limit) statement.push(limit);

    return statement.join(' ');
}

/**
 * The `FROM` source: exactly one of `table` or `relation` is required.
 *
 * `table` is quoted one dot-separated segment at a time, so `main.events` is schema `main`,
 * table `events`. `relation` is the caller's own SQL and is used as-is.
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
