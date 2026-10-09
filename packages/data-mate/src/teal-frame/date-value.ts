import {
    BIGINT, SMALLINT, STRUCT, DuckDBStructValue, structValue,
} from '@duckdb/node-api';
import { isDateTuple, toISO8601 } from '@terascope/core-utils';
import { quoteLiteral } from '@terascope/sql-builder';

/**
 * How TealFrame stores a `Date`: as `DataFrame` holds one.
 *
 * `DataFrame` keeps epoch milliseconds, or a `DateTuple` - `[epochMillis, offsetMinutes]` - once
 * `setTimezone`, `toTimeZone` or `toTimeZoneUsingLocation` attached a display offset, and decides
 * per VALUE which it has. Every `Date` column here is the same pair:
 *
 *     STRUCT(ms BIGINT, tz_offset SMALLINT)        tz_offset NULL unless one was set
 *
 * One shape for every date, so nothing - not the adapter, not a filter, not a Parquet reader - has
 * to know whether some earlier step attached an offset; each row says so itself. A plain date
 * renders `...Z`, exactly as before.
 *
 * Measured against a TIMESTAMP at 100M rows (`docs/tools/bench/date-shape.mjs`): the file is 32%
 * SMALLER (milliseconds compress better than a TIMESTAMP's microseconds), a 50% range filter is
 * 23% faster and a write 21% faster; a date function pays ~19% for the per-row offset branch.
 *
 * **DuckDB does not treat a number as a date** - `hour(BIGINT)` does not bind and there is no
 * BIGINT -> TIMESTAMP cast - so every date expression reads `epoch_ms(...)` of the member.
*/

export const DATE_MS = 'ms';
export const DATE_OFFSET = 'tz_offset';

/** Milliseconds in a minute, for turning an offset into a shift. */
const MINUTE_MS = 60_000;

export const DATE_TYPE = STRUCT({ [DATE_MS]: BIGINT, [DATE_OFFSET]: SMALLINT });

/**
 * A JS date value as the struct: epoch millis (what `coerceToType` produces for a plain date), or
 * a `DateTuple`, whose offset is kept.
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

/** The struct back as `DataFrame` holds it: a `DateTuple`, or plain epoch millis. */
export function fromDateValue(value: unknown): unknown {
    const entries = (value as { entries?: Record<string, unknown> } | null)?.entries;
    if (entries == null) return value;

    const millis = entries[DATE_MS];
    if (millis == null) return null;
    const offset = entries[DATE_OFFSET];
    return offset == null ? Number(millis) : [Number(millis), Number(offset)];
}

/**
 * The struct as `rows()` sees it - `toPlainValue` has already made it `{ ms, tz_offset }` of
 * numbers - rendered as `DataFrame`'s `toISO8601` renders the same value. Anything else passes.
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

/** The instant, as a TIMESTAMP - what a date function reads when it ignores the offset. */
export function instantSQL(accessor: string): string {
    return `epoch_ms(${accessor}.${DATE_MS})`;
}

/**
 * The LOCAL wall time, as a TIMESTAMP: the instant shifted by the offset, or the instant itself
 * when there is none. This is `getValidDateWithTimezone` - what `DataFrame`'s date functions read
 * from a `DateTuple` - and it is how the per-row "is this a tuple?" check costs one `coalesce`.
*/
export function localSQL(accessor: string): string {
    return `epoch_ms(${accessor}.${DATE_MS} + coalesce(${accessor}.${DATE_OFFSET}, 0) * ${MINUTE_MS})`;
}

/**
 * A TIMESTAMP result back into a date value, with no offset - a date function that returns a
 * date returns plain epoch millis in `DataFrame` too, tuple input or not.
*/
export function fromTimestampSQL(expression: string): string {
    return `CASE WHEN (${expression}) IS NULL THEN NULL ELSE`
        + ` {'${DATE_MS}': epoch_ms(${expression}), '${DATE_OFFSET}': NULL::SMALLINT} END`;
}

/**
 * The date rendered as JSON text in SQL, byte-equal to `toISO8601`: no offset, or 0, is UTC with
 * a `Z`; any other is the LOCAL wall time followed by `+HH:MM` / `-HH:MM`.
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
