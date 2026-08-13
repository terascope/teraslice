import {
    DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields,
    DataTypeConfig, ReadonlyDataTypeConfig, FieldType, DeprecatedFieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';

/**
 * `DataTypeFieldConfig.type` is the enum OR the deprecated string union, and real
 * configs still carry both. The enum's values are those same strings, so a lookup
 * keyed by this works at runtime - it is only the types that need widening.
*/
export type FieldTypeLike = FieldType | DeprecatedFieldType;

/**
 * Maps a DataType field configuration onto the DuckDB type that will hold it.
 *
 * The DataType config is the authority here: the frame never infers a type from
 * the data. That is deliberate - `read_json` will happily infer, but its cast
 * rules diverge from data-mate's coercion on messy input (it rounds 12.7 to 13
 * where data-mate truncates to 12, and it drops the validation that semantic
 * types like IP carry), so the shape always comes from the declared field.
*/

/** Widths follow what data-mate actually enforces, not what the type name suggests. */
const SCALAR_TYPES: Readonly<Record<string, string | undefined>> = Object.freeze({
    [FieldType.Boolean]: 'BOOLEAN',

    // `Integer` is BIGINT, not INTEGER: data-mate bounds it by
    // Number.MAX_SAFE_INTEGER (2^53-1), which overflows int32.
    [FieldType.Byte]: 'TINYINT',
    [FieldType.Short]: 'SMALLINT',
    [FieldType.Integer]: 'BIGINT',

    // `Long` is a JS bigint, which is arbitrary precision. HUGEINT (128-bit)
    // rather than BIGINT (64-bit) so values above 2^63 survive the round trip.
    [FieldType.Long]: 'HUGEINT',

    // Float and Vector are DOUBLE, not FLOAT. data-mate's Float is a JS number,
    // i.e. a 64-bit IEEE-754 double; a 32-bit FLOAT silently rounds
    // 9007199254740992 to 9007199000000000 (measured).
    [FieldType.Float]: 'DOUBLE',
    [FieldType.Double]: 'DOUBLE',
    [FieldType.Number]: 'DOUBLE',
    [FieldType.Vector]: 'DOUBLE',

    // Every string-ish type is VARCHAR. The analyzer variants differ in how
    // Elasticsearch indexes them, not in how a value is stored.
    [FieldType.Keyword]: 'VARCHAR',
    [FieldType.KeywordCaseInsensitive]: 'VARCHAR',
    [FieldType.KeywordTokens]: 'VARCHAR',
    [FieldType.KeywordTokensCaseInsensitive]: 'VARCHAR',
    [FieldType.KeywordPathAnalyzer]: 'VARCHAR',
    [FieldType.NgramTokens]: 'VARCHAR',
    [FieldType.Text]: 'VARCHAR',
    [FieldType.String]: 'VARCHAR',
    [FieldType.Domain]: 'VARCHAR',
    [FieldType.Hostname]: 'VARCHAR',

    // IP stays VARCHAR rather than INET on purpose: INET needs a
    // runtime-installed extension, and data-mate is the stricter of the two
    // anyway - it rejects `01.02.03.04` where DuckDB reads it as `1.2.3.4`.
    // Keeping VARCHAR means the strictness stays in our coercion layer.
    [FieldType.IP]: 'VARCHAR',
    [FieldType.IPRange]: 'VARCHAR',

    [FieldType.Date]: 'TIMESTAMP',
    // VARCHAR, not BLOB: data-mate does no validation or decoding for Binary - it
    // accepts 'not base64!!!' unchanged - so storing the string as given is the
    // behaviour-preserving choice. Decoding would be a change.
    [FieldType.Binary]: 'VARCHAR',

    [FieldType.GeoPoint]: 'STRUCT(lat DOUBLE, lon DOUBLE)',
    [FieldType.Geo]: 'STRUCT(lat DOUBLE, lon DOUBLE)',
    [FieldType.Boundary]: 'STRUCT(lat DOUBLE, lon DOUBLE)[]',

    // GeoJSON is shape-dependent (Point/Polygon/MultiPolygon), so it stays JSON
    // until the spatial extension earns its place. `Any` is JSON by definition.
    [FieldType.GeoJSON]: 'JSON',
    [FieldType.Any]: 'JSON',
});

const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Quote an identifier unless it is already a bare one. */
export function quoteIdentifier(name: string): string {
    if (SAFE_IDENTIFIER.test(name)) return name;
    return `"${name.replace(/"/g, '""')}"`;
}

function isStructured(type: FieldTypeLike): boolean {
    return type === FieldType.Object || type === FieldType.Tuple;
}

/**
 * Resolve the immediate children of a field set, folding dot-notation entries
 * into the parent they belong to. `{ meta: Object, 'meta.tier': Integer }`
 * yields a single `meta` entry carrying `{ tier: Integer }` as its children.
*/
function resolveFields(
    fields: DataTypeFields | ReadonlyDataTypeFields
): { name: string; config: DataTypeFieldConfig; children?: DataTypeFields }[] {
    return Object.entries(fields)
        .filter(([name]) => !name.includes('.'))
        .map(([name, config]) => ({
            name,
            config,
            children: getChildDataTypeConfig(fields, name, config.type as FieldType),
        }));
}

/**
 * Returns the DuckDB type for a single DataType field.
 *
 * `childConfig` is only needed for Object and Tuple fields, matching
 * `coerceToType`'s signature so the two layers stay recognisably the same shape.
*/
export function getDuckDBType(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): string {
    const base = getBaseType(fieldConfig, childConfig);
    return fieldConfig.array ? `${base}[]` : base;
}

function getBaseType(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): string {
    const type = fieldConfig.type as FieldTypeLike;

    if (isStructured(type)) {
        // An Object with no declared children has no knowable shape, so it
        // stays JSON rather than becoming an empty STRUCT.
        if (childConfig == null || Object.keys(childConfig).length === 0) return 'JSON';

        const children = resolveFields(childConfig)
            .map(({ name, config, children: grandChildren }) => (
                `${quoteIdentifier(name)} ${getDuckDBType(config, grandChildren)}`
            ));

        return `STRUCT(${children.join(', ')})`;
    }

    const mapped = SCALAR_TYPES[type];
    if (mapped == null) {
        throw new TypeError(`Unsupported field type "${type}" - it has no DuckDB representation`);
    }
    return mapped;
}

/**
 * Returns the DuckDB column type for every top-level field in a DataType config.
 *
 * Dot-notation children are folded into their parent struct and do not appear as
 * columns of their own, so the result is the table's real column set.
*/
export function buildColumnTypes(
    config: DataTypeConfig | ReadonlyDataTypeConfig
): Record<string, string> {
    const fields = config.fields ?? {};
    if (Object.keys(fields).length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }

    return Object.fromEntries(
        resolveFields(fields).map(({ name, config: fieldConfig, children }) => (
            [name, getDuckDBType(fieldConfig, children)]
        ))
    );
}

/**
 * Returns the types `read_json` should read each column as, BEFORE our coercion runs.
 *
 * Every column comes back as JSON so that DuckDB does no casting of its own - its
 * cast rules are what diverge from the DataType config - and so the original JSON
 * type stays available to the coercion layer via `json_type()`.
*/
export function buildRawColumnTypes(
    config: DataTypeConfig | ReadonlyDataTypeConfig
): Record<string, string> {
    const fields = config.fields ?? {};
    if (Object.keys(fields).length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }

    // JSON for EVERY column, including scalars. Reading a scalar as VARCHAR would
    // discard the original JSON type, making the boolean `true` and the string
    // `"true"` identical - and data-mate treats those differently.
    //
    // COST, measured end-to-end: the read itself is cheaper than VARCHAR (52 ms vs
    // 72 ms over 200k x 12), but the whole ingest is ~30% SLOWER (274 ms vs 209 ms
    // at 1M), because every expression now pays `->> '$'` and `json_type()` per
    // value. Bought 7 fewer divergences (379/390 vs 372/390) for that. The obvious
    // recovery is to project text and json_type ONCE per column in an inner
    // SELECT rather than re-deriving them in each branch - not yet measured.
    return Object.fromEntries(
        resolveFields(fields).map(({ name }) => [name, 'JSON'])
    );
}
