import {
    DuckDBType, DuckDBGeometryValue, DuckDBVarCharType,
    BOOLEAN, TINYINT, SMALLINT, BIGINT, HUGEINT, DOUBLE, VARCHAR, GEOMETRY,
    LIST, STRUCT,
} from '@duckdb/node-api';
import {
    DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields, FieldType, DeprecatedFieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { wkbToGeoShape } from './wkb.js';
import { parseJSONText } from './plain-values.js';
import { isJSONColumn } from './row-shape.js';
import { DATE_TYPE, fromDateValue } from './date-value.js';

/**
 * Maps field configs to the DuckDB type objects a scalar function is registered with, and
 * converts the values DuckDB passes to it.
 *
 * Both work from the full field config rather than a bare `FieldType`, because a bare type
 * cannot describe a list, a struct with members, or JSON.
 *
 * **This must agree with `DataType.toDuckDB()`**, which produces the same mapping as type
 * strings for DDL. Registration needs the binding's type objects, and `@terascope/data-types`
 * does not depend on `@duckdb/node-api`. A mismatch shows up as a bind error, or as a column
 * whose type contradicts its config (which `diffSchema` reports).
*/

/**
 * `DataTypeFieldConfig.type` is either the enum or the deprecated string union, and configs still
 * use both. The enum's values are the same strings.
*/
type FieldTypeLike = FieldType | DeprecatedFieldType;

type Children = DataTypeFields | ReadonlyDataTypeFields;

/**
 * DuckDB's `JSON` type is a VARCHAR with an alias, registered by the json extension. The binding
 * exports no constant for it, so it is created here.
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
    [FieldType.Date]: DATE_TYPE,
    [FieldType.GeoPoint]: GEO_POINT_TYPE,
    [FieldType.Geo]: GEO_POINT_TYPE,
    [FieldType.Boundary]: LIST(GEO_POINT_TYPE),
    [FieldType.GeoJSON]: GEOMETRY,
    [FieldType.Any]: JSON_TYPE,
};

export interface UdfTypeOptions {
    /**
     * Widens `Long` and `Integer` to HUGEINT. Use it for results only: a computed result may be
     * wider than a stored Long (`ipToInt` on an IPv6 address is 128 bits), while a parameter is
     * read from a stored BIGINT column.
    */
    wide?: boolean;
}

/** The direct members of an Object or Tuple; dotted descendants are skipped. */
function members(childConfig: Children): [name: string, config: DataTypeFieldConfig][] {
    return Object.entries(childConfig).filter(([name]) => !name.includes('.'));
}

/** Returns the DuckDB type object for a field config, or throws if the type has none. */
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
        // no declared shape, so the column is JSON (as in `object.ts` and `tuple-type.ts`)
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
 * Builds the converter for a STRUCT value. An Object becomes an object; a Tuple becomes an array
 * in position order, which is how `DataFrame` holds it.
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
 * The inverse of `makeValueConverter`: converts the value DuckDB passes to a scalar function into
 * the value `DataFrame` would pass to the same function.
 *
 * - A `Date` becomes what `DateVector` holds: epoch millis, or an `[ms, offset]` tuple. No string
 *   parsing is involved, so the result does not depend on the host time zone.
 * - A LIST becomes a JS array, and a STRUCT becomes an object (or, for a Tuple, an array).
 * - A GEOMETRY becomes the GeoShape its WKB encodes.
 * - A JSON column (`Any` or an untyped `Object`) is stored as JSON text, so it is parsed.
 * - A `Long` stays a `bigint`, which the functions already expect.
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

    // epoch millis, or a `DateTuple`, as `DataFrame` passes to the same function
    if (type === FieldType.Date) return fromDateValue;

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
