import { TSError } from '@terascope/core-utils';
import { DataTypeFields } from '@terascope/types';
import { quoteIdentifier } from '@terascope/sql-builder';
import { FrameConfig } from './interfaces.js';

/**
 * `@expandValues` - one array element per output row - as the QPL engine's `expand-values.ts` does
 * it, in two modes:
 *
 * - `correlate: true` - on a search or `qpl_context`, with `fields`: a POSITIONAL ZIP, as many rows
 *   as the longest list, shorter lists padded with null.
 * - `correlate: false` - on individual fields: STACKED, as many rows as the lengths ADD UP to, each
 *   field in its own block with the other expanded fields null there.
 *
 * Both keep a row whose expanded lists are ALL null or empty, as one row with those fields null -
 * a plain `unnest` would drop it. Fields not expanded are copied onto every output row. Blocks
 * follow the FRAME's column order, not the order `fields` were named in, as the engine's builder
 * loop does. The expanded fields come out with `array: false`.
 *
 * **One SELECT, no UNION ALL, so row order is kept**: each row unnests a list of `{ k, i }` pairs -
 * which field, which position - and every expanded column is `field[i]` where `k` names it. The
 * pairs have one type whatever the fields hold, so no element type has to be spelled out.
*/

export interface ExpandValuesOptions {
    /** `true`: positional zip (search / `qpl_context`). `false`: one block per field. */
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
