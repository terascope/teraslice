import { quoteIdentifier } from '@terascope/sql-builder';
import { SelectList } from './interfaces.js';

/**
 * Clause fragments that are the FRAME's own, not shared SQL.
 *
 * `ORDER BY`, `GROUP BY` and `LIMIT`/`OFFSET` all come from `@terascope/sql-builder`, because
 * a translated statement has to render them identically. What is left here is the projection,
 * which the frame builds from a shape only it accepts.
*/

/**
 * A `SELECT` list and the columns it produces, from either shape a caller holds.
 *
 * A map supplies both - its keys ARE the column names, and each expression is aliased to one.
 * A verbatim string supplies neither, because a `SELECT` list cannot be parsed back into
 * names without parsing SQL: `struct_pack(...) AS "nested"` and `a.*` are both legal and
 * neither yields its columns to a regular expression. So a verbatim list must be given
 * `columns` - which `QueryAccess.restrictSQLParts` returns beside it, as `columns`.
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
