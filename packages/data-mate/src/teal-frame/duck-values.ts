import {
    structValue, listValue, timestampValue, geometryValue, DuckDBTimestampValue
} from '@duckdb/node-api';
import {
    DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields,
    FieldType, DeprecatedFieldType, GeoShape
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { geoShapeToWKB } from './wkb.js';

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
 * semantics - see docs/ingest-findings.md, the STOP block.
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
    if (type === FieldType.Date) return (value) => (value == null ? null : toTimestamp(value));

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

/**
 * The INVERSE of `makeValueConverter`: what DuckDB hands a scalar function, turned into the
 * representation data-mate's own primitives expect.
 *
 * **This exists because its absence was a silent, machine-dependent defect.**
 * `createScalarFunction` used to pass DuckDB's value straight through, so a `Date` column arrived
 * as a `DuckDBTimestampValue`. Its `toString()` is `'2026-08-14 01:02:03.456'` - space-separated
 * and **zone-less** - and every date primitive coerces an object by stringifying it, so the value
 * went through `new Date('2026-08-14 01:02:03.456')`, which parses a zone-less string as
 * **MACHINE-LOCAL**. Every date UDF's input therefore drifted by the host's UTC offset: 0 under
 * `TZ=UTC`, +4h under `America/New_York`, -9h under `Asia/Tokyo`.
 *
 * It was not confined to the timezone functions, or even to `Date` results. Measured under
 * New York, 13 of 16 date functions diverged from `DataFrame` - `formatDate` (String),
 * `getUTCHours` (Number), `addToDate` (Date) - and `isAfter`/`isBefore`/`isBetween` **flipped**
 * between two `TZ` values on identical data and an identical query.
 *
 * **`Date` is the only type that needed this.** Measured, what a UDF receives per column type:
 * `Long` -> `BigInt`, `IP`/`Keyword`/`Text` -> `String`, `Double`/`Float`/`Number` -> `Number`,
 * `Boolean` -> `Boolean`, and an array element arrives already unwrapped (`INDIVIDUAL_VALUES`
 * maps with `list_transform`, so the UDF stays scalar). All of those are what the primitives
 * already expect. `GeoPoint` and friends throw at REGISTRATION - `duckDBTypeObject` refuses a
 * STRUCT - which is loud rather than silent. Only `Date` gave a wrong answer quietly.
 *
 * Epoch millis as a plain `number`, deliberately, not an ISO string: it is what `DateVector`
 * itself holds for an offset-0 date (verified), `toEpochMSOrThrow` returns it untouched, and it
 * costs no format-then-parse per row. `toPlainValue` in `TealFrame.ts` makes the same numeric
 * conversion for the `rows()` output path - `Number(micros / 1000n)` - so the two agree.
*/
export function makeInputConverter(type: FieldTypeLike): ValueConverter {
    if (type === FieldType.Date) {
        return (value) => (value instanceof DuckDBTimestampValue
            ? Number(value.micros / 1000n)
            : value);
    }

    return (value) => value;
}
