import {
    BIGINT, SMALLINT, STRUCT, DuckDBStructValue, structValue,
} from '@duckdb/node-api';
import { isDateTuple, toISO8601 } from '@terascope/core-utils';
import { quoteLiteral } from '@terascope/sql-builder';

/**
 * How TealFrame stores a `Date` field, matching what `DataFrame` holds.
 *
 * `DataFrame` stores epoch milliseconds, or a `DateTuple` (`[epochMillis, offsetMinutes]`) once
 * `setTimezone`, `toTimeZone` or `toTimeZoneUsingLocation` has attached a display offset. The
 * choice is made per value. Here every `Date` column has one type:
 *
 *     STRUCT(ms BIGINT, tz_offset SMALLINT)        tz_offset is NULL unless an offset was set
 *
 * With one shape for every date, readers never need to know whether an earlier step attached an
 * offset. A date without an offset renders with a `Z` suffix.
 *
 * Compared with a TIMESTAMP column, the file is about a third smaller (milliseconds compress
 * better than microseconds) and range filters and writes are faster. Date functions pay a small
 * cost for the per-row offset check.
 *
 * DuckDB does not treat a number as a date (`hour(BIGINT)` does not bind and there is no
 * BIGINT to TIMESTAMP cast), so every date expression wraps the member in `epoch_ms(...)`.
*/

export const DATE_MS = 'ms';
export const DATE_OFFSET = 'tz_offset';

/** Milliseconds in a minute, for turning an offset into a shift. */
const MINUTE_MS = 60_000;

export const DATE_TYPE = STRUCT({ [DATE_MS]: BIGINT, [DATE_OFFSET]: SMALLINT });

/**
 * Converts a JS date value to the struct. Accepts epoch millis (what `coerceToType` produces for
 * a plain date) or a `DateTuple`, whose offset is kept.
*/
export function toDateValue(value: unknown): DuckDBStructValue | null {
    if (value == null) return null;
    const [millis, offset] = isDateTuple(value) ? value : [Number(value), null];
    if (!Number.isFinite(millis)) return null;

    return structValue({
        [DATE_MS]: BigInt(Math.trunc(millis)),
        [DATE_OFFSET]: offset,
    });
}

/** Converts the struct back to `DataFrame`'s form: a `DateTuple`, or plain epoch millis. */
export function fromDateValue(value: unknown): unknown {
    const entries = (value as { entries?: Record<string, unknown> } | null)?.entries;
    if (entries == null) return value;

    const millis = entries[DATE_MS];
    if (millis == null) return null;
    const offset = entries[DATE_OFFSET];
    return offset == null ? Number(millis) : [Number(millis), Number(offset)];
}

/**
 * Renders a plain `{ ms, tz_offset }` object (the struct after `toPlainValue`) the way
 * `DataFrame`'s `toISO8601` renders the same value. Other values are returned unchanged.
*/
export function renderPlainDate(value: unknown): unknown {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
    const record = value as Record<string, unknown>;
    if (!(DATE_MS in record)) return value;

    const millis = record[DATE_MS];
    if (millis == null) return null;
    const offset = record[DATE_OFFSET];
    return toISO8601(offset == null ? Number(millis) : [Number(millis), Number(offset)]);
}

/** SQL for the instant as a TIMESTAMP, for date functions that ignore the offset. */
export function instantSQL(accessor: string): string {
    return `epoch_ms(${accessor}.${DATE_MS})`;
}

/**
 * SQL for the local wall time as a TIMESTAMP: the instant shifted by the offset, or the instant
 * itself when there is none. This matches `getValidDateWithTimezone`, which `DataFrame`'s date
 * functions use on a `DateTuple`. The per-row offset check is a single `coalesce`.
*/
export function localSQL(accessor: string): string {
    return `epoch_ms(${accessor}.${DATE_MS} + coalesce(${accessor}.${DATE_OFFSET}, 0) * ${MINUTE_MS})`;
}

/**
 * SQL that turns a TIMESTAMP back into a date value with no offset. In `DataFrame`, a date
 * function that returns a date also returns plain epoch millis, even for tuple input.
*/
export function fromTimestampSQL(expression: string): string {
    return `CASE WHEN (${expression}) IS NULL THEN NULL ELSE`
        + ` {'${DATE_MS}': epoch_ms(${expression}), '${DATE_OFFSET}': NULL::SMALLINT} END`;
}

/**
 * SQL that renders the date as JSON text, byte-for-byte equal to `toISO8601`. A missing or zero
 * offset renders as UTC with a `Z`; any other offset renders the local wall time followed by
 * `+HH:MM` or `-HH:MM`.
*/
export function dateJson(accessor: string): string {
    const offset = `${accessor}.${DATE_OFFSET}`;
    const utc = `strftime(${instantSQL(accessor)}, ${quoteLiteral('%Y-%m-%dT%H:%M:%S.%gZ')})`;
    const local = `strftime(${localSQL(accessor)}, ${quoteLiteral('%Y-%m-%dT%H:%M:%S.%g')})`;
    const sign = `CASE WHEN ${offset} < 0 THEN '-' ELSE '+' END`;
    const pad = (part: string) => `lpad(CAST(${part} AS VARCHAR), 2, '0')`;
    const zone = `${sign} || ${pad(`abs(${offset}) // 60`)} || ':' || ${pad(`abs(${offset}) % 60`)}`;

    return `to_json(CASE WHEN ${accessor}.${DATE_MS} IS NULL THEN NULL`
        + ` WHEN coalesce(${offset}, 0) = 0 THEN ${utc}`
        + ` ELSE ${local} || ${zone} END)::VARCHAR`;
}
