import {
    DuckDBType, DuckDBTimestampValue, DuckDBGeometryValue, DuckDBVarCharType,
    BOOLEAN, TINYINT, SMALLINT, BIGINT, HUGEINT, DOUBLE, VARCHAR, TIMESTAMP, GEOMETRY,
    LIST, STRUCT,
} from '@duckdb/node-api';
import {
    DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields, FieldType, DeprecatedFieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { wkbToGeoShape } from './wkb.js';
import { parseJSONText } from './plain-values.js';
import { isJSONColumn } from './row-shape.js';

/**
 * The DuckDB type OBJECTS a scalar function is registered with, and the conversion of what DuckDB
 * then hands it - both driven by the FULL field config, not a bare `FieldType`.
 *
 * A bare type could not say "a list of", "a struct of these members" or "JSON", so every geo
 * function, the array reducers, `split`, `parseJSON`, `lookup`, `toGeoPoint` and `toGeoJSON` had
 * no UDF at all (known-defects DF4, DF7). Their SQL emission was the only way they ran.
 *
 * **This must agree with `DataType.toDuckDB()`**, which gives the same mapping as type STRINGS
 * for DDL: registration needs the binding's type objects, and `@terascope/data-types` neither
 * depends on `@duckdb/node-api` nor should. A mismatch shows up as a bind error, or as a column
 * whose type contradicts its config - which is what `diffSchema` exists to catch.
*/

/**
 * `DataTypeFieldConfig.type` is the enum OR the deprecated string union, and real configs still
 * carry both; the enum's values are those same strings.
*/
type FieldTypeLike = FieldType | DeprecatedFieldType;

type Children = DataTypeFields | ReadonlyDataTypeFields;

/**
 * DuckDB's `JSON` is a VARCHAR with an alias, which is what the json extension registers. The
 * binding exports no constant for it, so it is built here once.
*/
const JSON_TYPE = DuckDBVarCharType.create('JSON');

/** A GeoPoint is `STRUCT(lat DOUBLE, lon DOUBLE)`, as `geo-point.ts` declares it. */
const GEO_POINT_TYPE = STRUCT({ lat: DOUBLE, lon: DOUBLE });

const SCALAR_TYPES: Readonly<Record<string, DuckDBType | undefined>> = {
    [FieldType.Boolean]: BOOLEAN,
    [FieldType.Byte]: TINYINT,
    [FieldType.Short]: SMALLINT,
    [FieldType.Integer]: BIGINT,
    [FieldType.Long]: BIGINT,
    [FieldType.Float]: DOUBLE,
    [FieldType.Double]: DOUBLE,
    [FieldType.Number]: DOUBLE,
    [FieldType.Vector]: DOUBLE,
    [FieldType.Keyword]: VARCHAR,
    [FieldType.KeywordCaseInsensitive]: VARCHAR,
    [FieldType.KeywordTokens]: VARCHAR,
    [FieldType.KeywordTokensCaseInsensitive]: VARCHAR,
    [FieldType.KeywordPathAnalyzer]: VARCHAR,
    [FieldType.NgramTokens]: VARCHAR,
    [FieldType.Text]: VARCHAR,
    [FieldType.String]: VARCHAR,
    [FieldType.Domain]: VARCHAR,
    [FieldType.Hostname]: VARCHAR,
    [FieldType.IP]: VARCHAR,
    [FieldType.IPRange]: VARCHAR,
    [FieldType.Binary]: VARCHAR,
    [FieldType.Date]: TIMESTAMP,
    [FieldType.GeoPoint]: GEO_POINT_TYPE,
    [FieldType.Geo]: GEO_POINT_TYPE,
    [FieldType.Boundary]: LIST(GEO_POINT_TYPE),
    [FieldType.GeoJSON]: GEOMETRY,
    [FieldType.Any]: JSON_TYPE,
};

export interface UdfTypeOptions {
    /**
     * Widen `Long`/`Integer` to HUGEINT. **For a RESULT only**: a result is computed, so it may be
     * wider than a stored Long (`ipToInt` on an IPv6 address is 128 bits). A PARAMETER is read from
     * a stored column, which is a BIGINT.
    */
    wide?: boolean;
}

/** The members of an Object or Tuple, by name; dotted descendants are folded into their parent. */
function members(childConfig: Children): [name: string, config: DataTypeFieldConfig][] {
    return Object.entries(childConfig).filter(([name]) => !name.includes('.'));
}

/** The DuckDB type object for a field config, or a clear error naming the gap. */
export function udfTypeFor(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: Children,
    options: UdfTypeOptions = {}
): DuckDBType {
    if (fieldConfig.array) {
        return LIST(udfTypeFor({ ...fieldConfig, array: false }, childConfig, options));
    }

    const type = fieldConfig.type as FieldTypeLike;

    if (type === FieldType.Object || type === FieldType.Tuple) {
        // no declared shape, so the column is JSON - `object.ts` / `tuple-type.ts`
        if (isJSONColumn(type as FieldType, childConfig)) return JSON_TYPE;

        return STRUCT(Object.fromEntries(members(childConfig!).map(([name, config]) => [
            name,
            udfTypeFor(
                config,
                getChildDataTypeConfig(childConfig!, name, config.type as FieldType),
                options
            ),
        ])));
    }

    if (options.wide && (type === FieldType.Long || type === FieldType.Integer)) return HUGEINT;

    const mapped = SCALAR_TYPES[type];
    if (mapped == null) {
        throw new TypeError(
            `Field type "${type}" cannot be a scalar function parameter or result`
            + ' - it has no DuckDB type object mapping'
        );
    }
    return mapped;
}

export type InputConverter = (value: unknown) => unknown;

const identity: InputConverter = (value) => value;

/** The plain items of a LIST value; `DuckDBListValue` carries them as `items`. */
function listItems(value: unknown): unknown[] | undefined {
    const items = (value as { items?: unknown } | null)?.items;
    return Array.isArray(items) ? items : undefined;
}

/** The members of a STRUCT value; `DuckDBStructValue` carries them as `entries`. */
function structEntries(value: unknown): Record<string, unknown> | undefined {
    const entries = (value as { entries?: unknown } | null)?.entries;
    return entries != null && typeof entries === 'object'
        ? entries as Record<string, unknown>
        : undefined;
}

/**
 * Builds the converter for the declared members of an Object (an object) or a Tuple (an array in
 * position order, which is how `DataFrame` holds one - the STRUCT is only DuckDB's encoding).
*/
function structConverter(
    type: FieldTypeLike,
    childConfig: Children,
    declared: [name: string, config: DataTypeFieldConfig][]
): InputConverter {
    const converters = declared.map(([name, config]) => ({
        name,
        convert: makeInputConverter(
            config,
            getChildDataTypeConfig(childConfig, name, config.type as FieldType)
        ),
    }));
    if (type === FieldType.Tuple) {
        converters.sort((a, b) => Number(a.name) - Number(b.name));
    }

    return (value) => {
        const entries = structEntries(value);
        if (entries == null) return value;
        if (type === FieldType.Tuple) {
            return converters.map(({ name, convert }) => convert(entries[name] ?? null));
        }
        return Object.fromEntries(
            converters.map(({ name, convert }) => [name, convert(entries[name] ?? null)])
        );
    };
}

/**
 * The INVERSE of `makeValueConverter`: what DuckDB hands a scalar function, turned into the value
 * `DataFrame` would have handed the same function.
 *
 * **`Date` is why this exists.** A TIMESTAMP arrives as a `DuckDBTimestampValue` whose `toString()`
 * is zone-less, and the date primitives coerce an object by stringifying it - so every date UDF's
 * input drifted by the host's UTC offset (13 of 16 date functions diverged under New York). Epoch
 * millis as a plain `number` is what `DateVector` itself holds for an offset-0 date, and costs no
 * format-then-parse per row.
 *
 * The rest are the encodings `udfTypeFor` chose, undone: a LIST is a JS array, a STRUCT the object
 * (or, for a Tuple, the array) it was built from, a GEOMETRY the GeoShape its WKB encodes, and a
 * JSON column the value its text encodes. **That JSON parse is decoding the storage format, not
 * undoing a step of our own**: `Any` and untyped `Object` are stored as JSON text (VARIANT was
 * measured and rejected, DF16), so text is what the column holds. `Long` stays a `bigint`, which
 * is what the primitives already expect.
*/
export function makeInputConverter(
    field: FieldTypeLike | DataTypeFieldConfig,
    childConfig?: Children
): InputConverter {
    const fieldConfig: DataTypeFieldConfig = typeof field === 'string'
        ? { type: field as FieldType }
        : field;
    const type = fieldConfig.type as FieldTypeLike;

    if (fieldConfig.array) {
        const element = makeInputConverter({ ...fieldConfig, array: false }, childConfig);
        return (value) => {
            const items = listItems(value);
            if (items == null) return value;
            return items.map((item) => (item == null ? item : element(item)));
        };
    }

    if (type === FieldType.Date) {
        return (value) => (value instanceof DuckDBTimestampValue
            ? Number(value.micros / 1000n)
            : value);
    }

    if (type === FieldType.GeoJSON) {
        return (value) => (value instanceof DuckDBGeometryValue
            ? wkbToGeoShape(value.bytes)
            : value);
    }

    if (isJSONColumn(type as FieldType, childConfig)) return parseJSONText;

    if (type === FieldType.Object || type === FieldType.Tuple) {
        return structConverter(type, childConfig!, members(childConfig!));
    }

    if (type === FieldType.GeoPoint || type === FieldType.Geo) {
        return (value) => structEntries(value) ?? value;
    }

    if (type === FieldType.Boundary) {
        return (value) => {
            const items = listItems(value);
            return items == null ? value : items.map((item) => structEntries(item) ?? item);
        };
    }

    return identity;
}
