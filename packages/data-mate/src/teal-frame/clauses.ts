import { quoteIdentifier } from '@terascope/sql-builder';
import { SelectList } from './interfaces.js';

/**
 * SQL clause helpers specific to the frame.
 *
 * `ORDER BY`, `GROUP BY` and `LIMIT`/`OFFSET` come from `@terascope/sql-builder` so that
 * translated statements render them the same way. Only the projection is built here.
*/

/**
 * Builds a `SELECT` list and the column names it produces.
 *
 * With a map, the keys are the column names and each expression is aliased to its key.
 * A verbatim string cannot be turned back into column names without parsing SQL
 * (`struct_pack(...) AS "nested"` and `a.*` are both valid), so it must come with
 * `columns`. `QueryAccess.restrictSQLParts` returns both.
*/
export function selectList(
    select: SelectList,
    columns?: readonly string[]
): { list: string; names: readonly string[] } {
    if (typeof select === 'string') {
        if (!select.trim()) {
            throw new TypeError('a verbatim SELECT list cannot be empty');
        }
        if (columns == null) {
            throw new TypeError(
                'a verbatim SELECT list needs its `columns`, because a SELECT list cannot be'
                + ' parsed back into column names - QueryAccess.restrictSQLParts returns them'
                + ' beside it'
            );
        }
        return { list: select, names: columns };
    }

    const names = Object.keys(select);
    if (names.length === 0) {
        throw new TypeError('select requires at least one expression');
    }

    return {
        list: names.map((name) => `${select[name]} AS ${quoteIdentifier(name)}`).join(', '),
        names,
    };
}

/** Joins SQL fragments with a single space, dropping the ones that are empty. */
export function joinSQL(...parts: readonly string[]): string {
    return parts.filter(Boolean).join(' ');
}
