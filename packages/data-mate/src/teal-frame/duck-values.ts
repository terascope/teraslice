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
 * `DataTypeFieldConfig.type` is the enum OR the deprecated string union, and real configs
 * still carry both. The enum's values are those same strings, so a runtime lookup keyed by
 * this works - only the types need widening.
*/
type FieldTypeLike = FieldType | DeprecatedFieldType;

/**
 * Converts a value that `coerceToType` has already produced into the representation a
 * DuckDB vector accepts.
 *
 * This is the ONLY new logic the ingest path needs. Coercion itself is `coerceToType`
 * from the regular builder, so there is no second implementation of any field
 * semantics.
 *
 * The conversions are driven by the field config, matching `type-map.ts` exactly: get
 * one wrong and DuckDB rejects the append rather than silently storing something else.
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
 * `toBigIntOrThrow` ADDS 1 to every value it PARSES above this bound, and `bigIntToJSON`
 * subtracts it again, so the pair cancels for `DataFrame` (DEF-BIGINT, #4555). The same `-1`
 * is applied here so the value that lands in DuckDB is the value that went in.
 *
 * That is only exact if EVERY value above the bound took the `+1`, and a bigint INPUT did not:
 * `toBigIntOrThrow` returns one untouched, so `9007199254740993n` was stored as `...992`.
 * {@link makeBigIntInputNormaliser} closes that gap by handing such a bigint to coercion as its
 * decimal string - exact, and parsed on the same path as a string input.
*/
const MAX_SAFE_BIGINT = 9007199254740991n;

/** The signed 64-bit range of a BIGINT column - and of an Elasticsearch `long`. */
const MIN_INT64 = -9223372036854775808n;
const MAX_INT64 = 9223372036854775807n;

function toBigInt(value: unknown, int64: boolean): bigint | null {
    if (typeof value === 'bigint') {
        const exact = value > MAX_SAFE_BIGINT ? value - 1n : value;
        // THROWN, so ingest records a coercion failure: a BIGINT vector would otherwise
        // be handed a value it cannot hold
        if (int64 && (exact < MIN_INT64 || exact > MAX_INT64)) {
            throw new RangeError(`${exact} is outside the signed 64-bit range of a Long`);
        }
        return exact;
    }
    const num = Number(value);
    return Number.isFinite(num) ? BigInt(Math.trunc(num)) : null;
}

/** A bigint core-utils would return unparsed, and so without the `+1` the converter undoes. */
function unparsedBigInt(value: unknown): unknown {
    return typeof value === 'bigint' && value > MAX_SAFE_BIGINT ? value.toString(10) : value;
}

/** Turns the RAW input for one field into the form ingest coerces exactly. */
export type InputNormaliser = (value: unknown) => unknown;

/**
 * The normaliser for one field, or `undefined` when nothing in it is a `Long` - most fields,
 * which then pay nothing per row.
 *
 * It walks the field's config, not the value, so only `Long` positions are touched: a bigint
 * handed to an `Any` field stays a bigint. Every result is a new value; the caller's record is
 * never modified.
*/
export function makeBigIntInputNormaliser(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): InputNormaliser | undefined {
    const type = fieldConfig.type as FieldTypeLike;
    const element = type === FieldType.Long
        ? unparsedBigInt
        : childNormaliser(type, childConfig);

    if (element == null) return undefined;
    if (!fieldConfig.array) return element;
    return (value) => (Array.isArray(value) ? value.map(element) : element(value));
}

/** Normalises the `Long` children of an Object or Tuple, by name or by position. */
function childNormaliser(
    type: FieldTypeLike,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): InputNormaliser | undefined {
    if ((type !== FieldType.Object && type !== FieldType.Tuple) || childConfig == null) {
        return undefined;
    }
    const children = Object.entries(childConfig)
        .filter(([name]) => !name.includes('.'))
        .map(([name, config]) => ({
            name,
            normalise: makeBigIntInputNormaliser(
                config,
                getChildDataTypeConfig(childConfig, name, config.type as FieldType)
            ),
        }))
        .filter((child): child is { name: string; normalise: InputNormaliser } => (
            child.normalise != null
        ));

    if (children.length === 0) return undefined;

    return (value) => {
        if (value == null || typeof value !== 'object') return value;
        const copy: Record<string, unknown> = Array.isArray(value)
            ? [...value] as unknown as Record<string, unknown>
            : { ...value as Record<string, unknown> };
        for (const { name, normalise } of children) {
            if (name in copy) copy[name] = normalise(copy[name]);
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
     * Allow integers beyond the signed 64-bit range. **Off for a stored column** - a `Long` is a
     * BIGINT, and a value it cannot hold is a coercion failure. **On for a scalar function's
     * RESULT**, which is a computed value in a wider vector: `ipToInt` on an IPv6 address is a
     * 128-bit `Long`.
    */
    wideIntegers?: boolean;
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
    // epoch millis, or a `DateTuple` whose offset is kept - see `date-value.ts`
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
