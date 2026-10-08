import {
    DuckDBType, DuckDBTypeId, DuckDBListType, DuckDBStructType, DuckDBStructValue,
    DuckDBTimestampValue, SMALLINT, STRUCT, TIMESTAMP, structValue, timestampValue,
} from '@duckdb/node-api';
import { isDateTuple, toISO8601 } from '@terascope/core-utils';
import { quoteLiteral } from '@terascope/sql-builder';

/**
 * A `Date` that carries a DISPLAY OFFSET - what `setTimezone`, `toTimeZone` and
 * `toTimeZoneUsingLocation` return.
 *
 * Those three return a `DateTuple`, `[epochMillis, offsetMinutes]`, and `DataFrame` keeps it: the
 * output renders in local time (`2023-08-22T17:41:50.172+02:00`) and every later date function
 * reads the offset - `getHours` answers in local hours, `isWednesday` decides by the local day. A
 * TIMESTAMP holds the instant only, so TealFrame stored `[millis]` and dropped the rest.
 *
 * Such a column is stored as `STRUCT(ts TIMESTAMP, tz_offset SMALLINT)`, and ONLY such a column -
 * every other `Date` stays a TIMESTAMP, so no SQL date function, filter or Parquet file elsewhere
 * changes. A column is one of these when its `DataTypeFieldAndChildren` says `date_offset`, which
 * `tealFrameAdapter` sets and the caller threads into the next step like the rest of the config.
*/

export const DATE_OFFSET_TS = 'ts';
export const DATE_OFFSET_MINUTES = 'tz_offset';

export const DATE_OFFSET_TYPE = STRUCT({
    [DATE_OFFSET_TS]: TIMESTAMP,
    [DATE_OFFSET_MINUTES]: SMALLINT,
});

/** Whether a column's DuckDB type is an offset date, or a list of them. */
export function isDateOffsetType(type: DuckDBType): boolean {
    if (type.typeId === DuckDBTypeId.LIST) {
        return isDateOffsetType((type as DuckDBListType).valueType);
    }
    if (type.typeId !== DuckDBTypeId.STRUCT) return false;
    const names = (type as DuckDBStructType).entryNames;
    return names.length === 2
        && names[0] === DATE_OFFSET_TS
        && names[1] === DATE_OFFSET_MINUTES;
}

/**
 * A JS date value as the struct. A `DateTuple` keeps its offset; anything else - epoch millis, as
 * `coerceToType` produces for a plain date - has none.
*/
export function toDateOffsetValue(value: unknown): DuckDBStructValue | null {
    if (value == null) return null;
    const [millis, offset] = isDateTuple(value) ? value : [Number(value), null];
    if (!Number.isFinite(millis)) return null;

    return structValue({
        [DATE_OFFSET_TS]: timestampValue(BigInt(millis) * 1000n),
        [DATE_OFFSET_MINUTES]: offset,
    });
}

/** The struct back as the value `DataFrame` holds: a `DateTuple`, or plain epoch millis. */
export function fromDateOffsetValue(value: unknown): unknown {
    const entries = (value as { entries?: Record<string, unknown> } | null)?.entries;
    if (entries == null) return value;

    const ts = entries[DATE_OFFSET_TS];
    if (!(ts instanceof DuckDBTimestampValue)) return null;
    const millis = Number(ts.micros / 1000n);
    const offset = entries[DATE_OFFSET_MINUTES];
    return offset == null ? millis : [millis, Number(offset)];
}

/**
 * The struct as `rows()` sees it - `toPlainValue` has already made `ts` an ISO string - rendered
 * as `toISO8601` renders the tuple. Anything else passes through.
*/
export function renderPlainDateOffset(value: unknown): unknown {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
    const record = value as Record<string, unknown>;
    if (!(DATE_OFFSET_MINUTES in record)) return value;

    const ts = record[DATE_OFFSET_TS];
    if (typeof ts !== 'string') return null;
    const offset = record[DATE_OFFSET_MINUTES];
    return offset == null ? ts : toISO8601([Date.parse(ts), Number(offset)]);
}

/**
 * The struct rendered as JSON text in SQL, byte-equal to `toISO8601`: an offset of 0 or none is
 * UTC with a `Z`; any other is the LOCAL wall time followed by `+HH:MM` / `-HH:MM`.
*/
export function dateOffsetJson(accessor: string): string {
    const ts = `${accessor}.${DATE_OFFSET_TS}`;
    const offset = `${accessor}.${DATE_OFFSET_MINUTES}`;
    const utc = `strftime(${ts}, ${quoteLiteral('%Y-%m-%dT%H:%M:%S.%gZ')})`;
    const local = `strftime(${ts} + to_minutes(${offset}), ${quoteLiteral('%Y-%m-%dT%H:%M:%S.%g')})`;
    const sign = `CASE WHEN ${offset} < 0 THEN '-' ELSE '+' END`;
    const pad = (part: string) => `lpad(CAST(${part} AS VARCHAR), 2, '0')`;
    const zone = `${sign} || ${pad(`abs(${offset}) // 60`)} || ':' || ${pad(`abs(${offset}) % 60`)}`;

    return `to_json(CASE WHEN ${accessor} IS NULL OR ${ts} IS NULL THEN NULL`
        + ` WHEN coalesce(${offset}, 0) = 0 THEN ${utc}`
        + ` ELSE ${local} || ${zone} END)::VARCHAR`;
}
