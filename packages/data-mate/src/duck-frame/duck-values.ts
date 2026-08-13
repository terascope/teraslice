import { structValue, listValue, timestampValue } from '@duckdb/node-api';
import {
    DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields, FieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { FieldTypeLike } from './type-map.js';

/**
 * Converts a value that `coerceToType` has already produced into the representation a
 * DuckDB vector accepts.
 *
 * This is the ONLY new logic the ingest path needs. Coercion itself is `coerceToType`
 * from the regular builder, so there is no second implementation of any field
 * semantics - see docs/ingest-findings.md, the STOP block.
 *
 * The conversions are driven by the field config, matching `type-map.ts` exactly: get
 * one wrong and DuckDB rejects the append rather than silently storing something else.
*/

export type ValueConverter = (value: unknown) => unknown;

/** Field types whose DuckDB column is BIGINT or HUGEINT, so they need a real BigInt. */
const BIG_INT_TYPES: ReadonlySet<string> = new Set<string>([
    FieldType.Integer, FieldType.Long,
]);

/** Field types held as a DOUBLE. */
const DOUBLE_TYPES: ReadonlySet<string> = new Set<string>([
    FieldType.Float, FieldType.Double, FieldType.Number, FieldType.Vector,
]);

/** Field types held as a narrow signed int, which want a Number not a BigInt. */
const SMALL_INT_TYPES: ReadonlySet<string> = new Set<string>([
    FieldType.Byte, FieldType.Short,
]);

const GEO_POINT_TYPES: ReadonlySet<string> = new Set<string>([
    FieldType.GeoPoint, FieldType.Geo,
]);

/**
 * `core-utils`' `_maxBigInt`, i.e. `BigInt(Number.MAX_SAFE_INTEGER)`.
 *
 * `toBigIntOrThrow` ADDS 1 above this bound and `bigIntToJSON` subtracts it again, so the
 * pair cancels for `DataFrame`. Taking the bigint straight from `coerceToType` gets the
 * `+1` without the `-1`, which stored '9007199254740993' as ...994. The same `-1` is
 * applied here so the value that lands in DuckDB is the value that went in.
 *
 * (Aside: for a real bigint INPUT data-mate skips the `+1` but still applies the `-1`, so
 * it loses 1 - a genuine defect, recorded in ingest-findings.md. This path is correct in
 * that case rather than bug-compatible.)
*/
const MAX_SAFE_BIGINT = 9007199254740991n;

function toBigInt(value: unknown): bigint | null {
    if (typeof value === 'bigint') {
        return value > MAX_SAFE_BIGINT ? value - 1n : value;
    }
    const num = Number(value);
    return Number.isFinite(num) ? BigInt(Math.trunc(num)) : null;
}

/**
 * `toEpochMSOrThrow` yields epoch millis, or a DateTuple whose first element is the
 * millis. TIMESTAMP is microseconds.
*/
function toTimestamp(value: unknown): unknown {
    const millis = Array.isArray(value) ? Number(value[0]) : Number(value);
    return Number.isFinite(millis) ? timestampValue(BigInt(millis) * 1000n) : null;
}

function toGeoPoint(value: unknown): unknown {
    if (typeof value !== 'object' || value == null) return null;
    const point = value as { lat?: unknown; lon?: unknown };
    return structValue({ lat: Number(point.lat), lon: Number(point.lon) });
}

/**
 * Returns the converter for one field.
 *
 * Nils pass straight through as null: `coerceToType` already short-circuits them via
 * `callIfNotNil`, so a nil never reached a primitive and must not be invented here
 * either. Getting that wrong is what produced `[NULL]` arrays and structs-of-nulls in
 * the abandoned SQL path.
*/
export function makeValueConverter(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): ValueConverter {
    const type = fieldConfig.type as FieldTypeLike;

    if (fieldConfig.array) {
        const element = makeValueConverter({ ...fieldConfig, array: false }, childConfig);
        return (value) => {
            if (value == null) return null;
            const items = Array.isArray(value) ? value : [value];
            return listValue(items.map(element) as never[]);
        };
    }

    if (type === FieldType.Object || type === FieldType.Tuple) {
        if (childConfig == null || Object.keys(childConfig).length === 0) {
            // no declared shape, so the column is JSON and the value goes as text
            return (value) => (value == null ? null : JSON.stringify(value));
        }
        const children = Object.entries(childConfig)
            .filter(([name]) => !name.includes('.'))
            .map(([name, config]) => ({
                name,
                convert: makeValueConverter(
                    config,
                    getChildDataTypeConfig(childConfig, name, config.type as FieldType)
                ),
            }));
        return (value) => {
            if (value == null) return null;
            const record = value as Record<string, unknown>;
            return structValue(Object.fromEntries(
                children.map(({ name, convert }) => [name, convert(record[name])])
            ) as Record<string, never>);
        };
    }

    if (GEO_POINT_TYPES.has(type)) return (value) => (value == null ? null : toGeoPoint(value));

    if (type === FieldType.Boundary) {
        return (value) => {
            if (value == null) return null;
            const points = Array.isArray(value) ? value : [value];
            return listValue(points.map(toGeoPoint) as never[]);
        };
    }

    if (BIG_INT_TYPES.has(type)) return (value) => (value == null ? null : toBigInt(value));
    if (SMALL_INT_TYPES.has(type)) return (value) => (value == null ? null : Number(value));
    if (DOUBLE_TYPES.has(type)) return (value) => (value == null ? null : Number(value));
    if (type === FieldType.Date) return (value) => (value == null ? null : toTimestamp(value));

    // GeoJSON and Any are JSON columns; everything else is VARCHAR/BOOLEAN and goes as is
    if (type === FieldType.GeoJSON || type === FieldType.Any) {
        return (value) => (value == null ? null : JSON.stringify(value));
    }

    return (value) => (value == null ? null : value);
}
