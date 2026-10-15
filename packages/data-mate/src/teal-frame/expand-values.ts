import { TSError } from '@terascope/core-utils';
import { DataTypeFields } from '@terascope/types';
import { quoteIdentifier } from '@terascope/sql-builder';
import { FrameConfig } from './interfaces.js';

/**
 * SQL for the `@expandValues` directive, which turns each array element into its own output
 * row. There are two modes:
 *
 * - `correlate: true` zips the lists by position: a row produces as many rows as its longest
 *   list, and shorter lists are padded with null.
 * - `correlate: false` stacks the lists: a row produces as many rows as its list lengths add
 *   up to. Each field gets its own block of rows, with the other expanded fields null there.
 *
 * In both modes, a row whose expanded lists are all null or empty is kept as one row with those
 * fields null (a plain `unnest` would drop it). Fields that are not expanded are copied onto
 * every output row. Blocks follow the frame's column order, not the order of `fields`. The
 * expanded fields come out with `array: false`.
 *
 * It is a single SELECT with no UNION ALL, so row order is kept. Each row unnests a list of
 * `{ k, i }` pairs (which field, which position), and each expanded column is `field[i]` where
 * `k` selects it. The pairs have the same type whatever the fields hold, so no element type
 * has to be spelled out.
*/

export interface ExpandValuesOptions {
    /** `true` zips the lists by position; `false` stacks one block of rows per field. */
    readonly correlate: boolean;
}

const PAIR = '__teal_expand';

function invalid(field: string): TSError {
    return new TSError(`Invalid use of @expandValues on field "${field}", expected array value`, {
        statusCode: 400,
        context: { safe: true },
    });
}

/** The list of `{ k, i }` pairs one input row expands into. */
function pairs(expanded: readonly string[], correlate: boolean): string {
    const length = (field: string) => `coalesce(len(${quoteIdentifier(field)}), 0)`;
    // a row with nothing to expand still produces one row: field -1, position 0, null everywhere
    const placeholder = `[{'k': -1, 'i': 0}]`;

    if (correlate) {
        const longest = expanded.length === 1
            ? length(expanded[0])
            : `greatest(${expanded.map(length).join(', ')})`;
        return `CASE WHEN ${longest} = 0 THEN ${placeholder}`
            + ` ELSE list_transform(range(1, ${longest} + 1), lambda i : {'k': 0, 'i': i}) END`;
    }

    const blocks = expanded.map((field, k) => (
        `list_transform(range(1, ${length(field)} + 1), lambda i : {'k': ${k}, 'i': i})`
    ));
    const all = blocks.length === 1 ? blocks[0] : `list_concat(${blocks.join(', ')})`;
    return `CASE WHEN len(${all}) = 0 THEN ${placeholder} ELSE ${all} END`;
}

export function expandValuesSQL(
    from: string,
    columns: readonly string[],
    config: FrameConfig,
    fields: readonly string[],
    options: ExpandValuesOptions
): { sql: string; config: FrameConfig } {
    const declared = (config.fields ?? {}) as DataTypeFields;
    for (const field of fields) {
        if (!columns.includes(field)) {
            throw new TSError(`Unknown column "${field}" in @expandValues`, {
                statusCode: 400,
                context: { safe: true },
            });
        }
        if (declared[field]?.array !== true) throw invalid(field);
    }

    const wanted = new Set(fields);
    const expanded = columns.filter((column) => wanted.has(column));
    const pick = (column: string) => {
        const k = expanded.indexOf(column);
        const ref = quoteIdentifier(column);
        if (k === -1) return ref;
        const which = options.correlate ? `${PAIR}.k = 0` : `${PAIR}.k = ${k}`;
        return `CASE WHEN ${which} THEN ${ref}[${PAIR}.i] END AS ${ref}`;
    };

    const inner = `SELECT *, unnest(${pairs(expanded, options.correlate)}) AS ${PAIR} FROM ${from}`;
    const sql = `SELECT ${columns.map(pick).join(', ')} FROM (${inner})`;

    const fieldsOut: DataTypeFields = Object.fromEntries(Object.entries(declared).map(
        ([name, field]) => [name, wanted.has(name) ? { ...field, array: false } : field]
    ));
    return { sql, config: { ...config, fields: fieldsOut } };
}
