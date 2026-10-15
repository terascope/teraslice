import { DuckDBTimestampValue, DuckDBGeometryValue } from '@duckdb/node-api';
import { toISO8601 } from '@terascope/core-utils';
import { wkbToGeoShape } from './wkb.js';

/**
 * Converts values read from DuckDB into the plain JS values `rows()` returns.
 *
 * `rows()` results are sent straight to callers, so no DuckDB value class may leak through:
 *
 * - LIST arrives as a `DuckDBListValue`, which would serialize as `{"items":[...]}`. It becomes
 *   an array.
 * - TIMESTAMP arrives as a `DuckDBTimestampValue`. It is rendered with `toISO8601`, as
 *   `DateVector.toJSONCompatibleValue` does.
 * - GEOMETRY arrives as WKB bytes. It is decoded back to the GeoShape a `GeoJSON` field holds.
 * - BIGINT and HUGEINT arrive as a JS `bigint`, which `JSON.stringify` cannot serialize.
 *   `bigIntToPlain` returns a number when the value fits exactly and a decimal string otherwise.
 *
 * `core-utils`' `bigIntToJSON` is not used, because it is wrong for values read from DuckDB
 * (#4555). It subtracts 1 from every positive value above the safe limit, to cancel a `+1` that
 * core-utils' parser adds, so a value that was never parsed comes back one too low. Its bound
 * is also a signed comparison, so large negative values lose precision instead of becoming
 * strings.
 *
 * The rule here is the same as in `export-json.ts` (`abs(value) > MAX_SAFE` becomes a decimal
 * string, anything smaller a number), so `rows()` and `ndjson()` always agree.
*/
export /** The largest whole number JSON can carry without `JSON.parse` rounding it. */
const MAX_SAFE_BIGINT = 9007199254740991n;

/**
 * Converts a bigint to a number when it fits exactly, or to an exact decimal string when it
 * does not.
 *
 * The bound applies to the magnitude, matching `abs(x) > 9007199254740991` in `export-json.ts`.
 * No arithmetic is applied to the value.
*/
function bigIntToPlain(value: bigint): number | string {
    if (value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT) return value.toString(10);
    return Number(value);
}

export function toPlainValue(value: unknown): unknown {
    if (value == null) return value;

    if (typeof value === 'bigint') return bigIntToPlain(value);

    if (typeof value !== 'object') return value;

    if (value instanceof DuckDBTimestampValue) {
        return toISO8601(Number(value.micros / 1000n));
    }

    // a GeoJSON column is a GEOMETRY, which the binding hands over as WKB
    if (value instanceof DuckDBGeometryValue) return wkbToGeoShape(value.bytes);

    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items.map(toPlainValue);

    const entries = (value as { entries?: unknown }).entries;
    if (entries != null && typeof entries === 'object') {
        return Object.fromEntries(
            Object.entries(entries as Record<string, unknown>)
                .map(([key, val]) => [key, toPlainValue(val)])
        );
    }

    return value;
}

/**
 * Parses a JSON column's text into the value it encodes. `Any` and untyped `Object` fields are
 * stored as DuckDB JSON columns, which DuckDB returns as text.
*/
export function parseJSONText(value: unknown): unknown {
    return typeof value === 'string' ? JSON.parse(value) : value;
}
