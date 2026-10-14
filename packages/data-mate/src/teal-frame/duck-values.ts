import {
    structValue, listValue, geometryValue
} from '@duckdb/node-api';
import {
    DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields,
    FieldType, DeprecatedFieldType, GeoShape
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { geoShapeToWKB } from './wkb.js';
import { toDateValue } from './date-value.js';

/**
 * `DataTypeFieldConfig.type` is either the enum or the deprecated string union, and configs
 * still use both. The enum's values are the same strings, so only the type needs widening.
*/
type FieldTypeLike = FieldType | DeprecatedFieldType;

/**
 * Converts values already produced by `coerceToType` into the form a DuckDB vector accepts.
 *
 * Coercion itself is done by `coerceToType`, so field semantics are not reimplemented here.
 * The conversions follow the field config and must match `DataType.toDuckDB()`; a mismatch makes
 * DuckDB reject the append rather than store the wrong value.
*/

export type ValueConverter = (value: unknown) => unknown;

/** Field types whose DuckDB column is a BIGINT, so they need a real BigInt. */
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
 * `toBigIntOrThrow` adds 1 to every value it parses above this bound, and `bigIntToJSON`
 * subtracts it again, so the two cancel out for `DataFrame` (#4555). The same `-1` is applied
 * here so DuckDB stores the original value.
 *
 * That only works if every value above the bound received the `+1`. `toBigIntOrThrow` returns a
 * bigint input unchanged, so {@link makeBigIntInputNormalizer} passes such a bigint to coercion
 * as a decimal string, which is parsed the same way as any string input.
*/
const MAX_SAFE_BIGINT = 9007199254740991n;

/** The signed 64-bit range of a BIGINT column, which matches an Elasticsearch `long`. */
const MIN_INT64 = -9223372036854775808n;
const MAX_INT64 = 9223372036854775807n;

function toBigInt(value: unknown, int64: boolean): bigint | null {
    if (typeof value === 'bigint') {
        const exact = value > MAX_SAFE_BIGINT ? value - 1n : value;
        // throw so ingest records a coercion failure instead of passing a BIGINT vector a
        // value it cannot hold
        if (int64 && (exact < MIN_INT64 || exact > MAX_INT64)) {
            throw new RangeError(`${exact} is outside the signed 64-bit range of a Long`);
        }
        return exact;
    }
    const num = Number(value);
    return Number.isFinite(num) ? BigInt(Math.trunc(num)) : null;
}

/**
 * Turns a bigint above the safe range into a decimal string, so core-utils parses it and
 * applies the `+1` that the converter later removes.
*/
function unparsedBigInt(value: unknown): unknown {
    return typeof value === 'bigint' && value > MAX_SAFE_BIGINT ? value.toString(10) : value;
}

/** Rewrites the raw input for one field into a form that ingest coerces exactly. */
export type InputNormalizer = (value: unknown) => unknown;

/**
 * Returns the bigint normalizer for one field, or `undefined` when the field contains no `Long`,
 * so most fields pay no per-row cost.
 *
 * It follows the field's config, not the value, so only `Long` positions change: a bigint in an
 * `Any` field stays a bigint. It returns new values and never modifies the caller's record.
*/
export function makeBigIntInputNormalizer(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): InputNormalizer | undefined {
    const type = fieldConfig.type as FieldTypeLike;
    const element = type === FieldType.Long
        ? unparsedBigInt
        : childNormalizer(type, childConfig);

    if (element == null) return undefined;
    if (!fieldConfig.array) return element;
    return (value) => (Array.isArray(value) ? value.map(element) : element(value));
}

/** Normalizes the `Long` children of an Object or Tuple, by name or by position. */
function childNormalizer(
    type: FieldTypeLike,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): InputNormalizer | undefined {
    if ((type !== FieldType.Object && type !== FieldType.Tuple) || childConfig == null) {
        return undefined;
    }
    const children = Object.entries(childConfig)
        .filter(([name]) => !name.includes('.'))
        .map(([name, config]) => ({
            name,
            normalize: makeBigIntInputNormalizer(
                config,
                getChildDataTypeConfig(childConfig, name, config.type as FieldType)
            ),
        }))
        .filter((child): child is { name: string; normalize: InputNormalizer } => (
            child.normalize != null
        ));

    if (children.length === 0) return undefined;

    return (value) => {
        if (value == null || typeof value !== 'object') return value;
        const copy: Record<string, unknown> = Array.isArray(value)
            ? [...value] as unknown as Record<string, unknown>
            : { ...value as Record<string, unknown> };
        for (const { name, normalize } of children) {
            if (name in copy) copy[name] = normalize(copy[name]);
        }
        return copy;
    };
}

function toGeoPoint(value: unknown): unknown {
    if (typeof value !== 'object' || value == null) return null;
    const point = value as { lat?: unknown; lon?: unknown };
    return structValue({ lat: Number(point.lat), lon: Number(point.lon) });
}

export interface ValueConverterOptions {
    /**
     * Allows integers beyond the signed 64-bit range. Leave it off for a stored column: a `Long`
     * is a BIGINT, and a value it cannot hold is a coercion failure. Turn it on for a scalar
     * function's result, which goes into a wider vector (`ipToInt` on an IPv6 address returns a
     * 128-bit `Long`).
    */
    wideIntegers?: boolean;
}

/**
 * Returns the converter for one field.
 *
 * Null and undefined become null. `coerceToType` skips nils via `callIfNotNil`, so the
 * converter must not turn a nil into an empty value either (such as a `[NULL]` list or a
 * struct of nulls).
*/
export function makeValueConverter(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields,
    options: ValueConverterOptions = {}
): ValueConverter {
    const type = fieldConfig.type as FieldTypeLike;
    const int64 = options.wideIntegers !== true;

    if (fieldConfig.array) {
        const element = makeValueConverter({ ...fieldConfig, array: false }, childConfig, options);
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
                    getChildDataTypeConfig(childConfig, name, config.type as FieldType),
                    options
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

    if (BIG_INT_TYPES.has(type)) return (value) => (value == null ? null : toBigInt(value, int64));
    if (SMALL_INT_TYPES.has(type)) return (value) => (value == null ? null : Number(value));
    if (DOUBLE_TYPES.has(type)) return (value) => (value == null ? null : Number(value));
    // epoch millis, or a `DateTuple` whose offset is kept; see `date-value.ts`
    if (type === FieldType.Date) return toDateValue;

    // GeoJSON is a GEOMETRY column, and the binding writes one only as WKB through a vector
    if (type === FieldType.GeoJSON) {
        return (value) => (value == null ? null : geometryValue(geoShapeToWKB(value as GeoShape)));
    }

    // Any is a JSON column; everything else is VARCHAR/BOOLEAN and goes as is
    if (type === FieldType.Any) {
        return (value) => (value == null ? null : JSON.stringify(value));
    }

    return (value) => (value == null ? null : value);
}
