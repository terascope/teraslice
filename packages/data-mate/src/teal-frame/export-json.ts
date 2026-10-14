import { DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFields, FieldType } from '@terascope/types';
import { quoteIdentifier, quoteLiteral } from '@terascope/sql-builder';
import { SerializeOptions } from '../vector/interfaces.js';
import { dateJson } from './date-value.js';

/**
 * Builds the SQL that renders a frame's rows as JSON, byte-identical to what `DataFrame`
 * produces.
 *
 * DuckDB's own `to_json` output differs from `DataFrame.toJSON` in these ways:
 *
 * | | `DataFrame` | DuckDB native |
 * |---|---|---|
 * | `Date` | `"2026-01-10T00:00:00.000Z"` (`toISO8601`) | `"2026-01-10 00:00:00"` |
 * | `Long` past `MAX_SAFE_INTEGER` | a string | a number `JSON.parse` rounds |
 * | a nil field, element or empty object | per `SerializeOptions`, see `Renderer` | `null` |
 * | an integral float | `5` | `5.0` |
 * | `-0` | `0` | `-0.0` |
 * | a non-finite float | `null` | `Infinity`, which is not valid JSON |
 * | a number at or above `1e21` | `1e+21` | `1e21` |
 *
 * Null handling is the widest difference, governed by the seven `SerializeOptions` flags rather
 * than one rule. The non-finite case is the only one that breaks the output: `JSON.parse`
 * rejects a bare `Infinity` or `NaN`, so one such value would make a whole line unreadable.
 *
 * Each difference is corrected in the generated SQL, so the export runs entirely inside DuckDB
 * and no file needs post-processing.
*/

/** Above this, `bigIntToJSON` switches to a string, because `JSON.parse` would round it. */
const MAX_SAFE = '9007199254740991';

/**
 * The magnitude at which `JSON.stringify` switches a number to exponential form.
 *
 * Below it, an integral double is written without a decimal point (`5`, not `5.0`). At or
 * above it, DuckDB's exponential form is used with a `+` added to the exponent.
*/
const EXPONENTIAL_THRESHOLD = '1e21';

/** Integer-ish types stored wide enough to exceed `MAX_SAFE_INTEGER`. */
const BIG_INTEGER_TYPES: ReadonlySet<string> = new Set([
    FieldType.Long, FieldType.Integer,
]);

/**
 * Types stored as a DuckDB `DOUBLE`.
 *
 * `Float` is included because it maps to DOUBLE, not FLOAT: the value is a JS number. See
 * `float.ts` in `data-types`.
*/
const DOUBLE_TYPES: ReadonlySet<string> = new Set([
    FieldType.Float, FieldType.Double, FieldType.Number, FieldType.Vector,
]);

/** Types stored as a `STRUCT(lat DOUBLE, lon DOUBLE)`, whose members need the double treatment. */
const GEO_POINT_TYPES: ReadonlySet<string> = new Set([
    FieldType.Geo, FieldType.GeoPoint,
]);

/**
 * How an export renders fields and nulls: `DataFrame`'s `SerializeOptions`, with the same
 * meaning, plus `removeNullFields` as a shorthand for two common presets. See
 * {@link resolveRules}.
*/
export interface JsonExportOptions extends SerializeOptions {
    /**
     * Selects a preset: `true` omits null fields and empty objects, `false` writes null fields
     * as `null`. Explicit `SerializeOptions` flags override the preset.
    */
    removeNullFields?: boolean;
}

/** A field's declared config plus any dot-notation children, resolved together. */
interface FieldNode {
    name: string;
    type: string;
    isArray: boolean;
    children?: Record<string, FieldNode>;
}

/**
 * Folds the flat, dot-notation `DataTypeConfig` fields into a tree.
 *
 * The config declares `metadata` and `metadata.source` as siblings, but the JSON value nests
 * them, and the corrections must reach nested values too (a `Date` three levels down still
 * needs rendering as ISO 8601).
*/
function buildTree(fields: DataTypeFields): Record<string, FieldNode> {
    const tree: Record<string, FieldNode> = {};

    for (const [path, config] of Object.entries(fields)) {
        const parts = path.split('.');
        let level = tree;
        let node: FieldNode | undefined;

        for (const part of parts) {
            node = level[part] ??= { name: part, type: FieldType.Object, isArray: false };
            node.children ??= {};
            level = node.children;
        }

        if (node) {
            node.type = String(config.type);
            node.isArray = config.array === true;
        }
    }

    // a node with no declared children is a leaf, not an empty object
    const prune = (nodes: Record<string, FieldNode>): void => {
        for (const entry of Object.values(nodes)) {
            if (entry.children && Object.keys(entry.children).length === 0) {
                delete entry.children;
            } else if (entry.children) {
                prune(entry.children);
            }
        }
    };
    prune(tree);

    return tree;
}

/**
 * The seven `SerializeOptions` flags, resolved. See {@link resolveRules}.
*/
interface Rules {
    useNullForUndefined: boolean;
    skipNilValues: boolean;
    skipEmptyArrays: boolean;
    skipNilListValues: boolean;
    skipNilObjectValues: boolean;
    skipEmptyObjects: boolean;
    skipDuplicateObjects: boolean;
}

const FLAGS = [
    'useNullForUndefined',
    'skipNilValues',
    'skipEmptyArrays',
    'skipNilListValues',
    'skipNilObjectValues',
    'skipEmptyObjects',
    'skipDuplicateObjects',
] as const satisfies readonly (keyof Rules)[];

/**
 * The two presets selected by `removeNullFields`: `true` omits null fields and empty objects,
 * `false` writes null fields as `null`.
*/
function nullFieldsPreset(removeNullFields: boolean): Rules {
    return {
        useNullForUndefined: !removeNullFields,
        skipNilValues: removeNullFields,
        skipEmptyArrays: false,
        skipNilListValues: false,
        skipNilObjectValues: true,
        skipEmptyObjects: removeNullFields,
        skipDuplicateObjects: false,
    };
}

/**
 * Resolves the rules an export follows.
 *
 * If any `SerializeOptions` flag is given, the flags mean exactly what they mean to
 * `DataFrame.toJSON`, and an unset flag is false. `removeNullFields` selects a preset that
 * explicit flags override. With neither, the default is the `removeNullFields: true` preset.
*/
export function resolveRules(options: JsonExportOptions = {}): Rules {
    const given = FLAGS.filter((flag) => options[flag] != null);
    const usePreset = options.removeNullFields != null || given.length === 0;
    const base: Rules = usePreset
        ? nullFieldsPreset(options.removeNullFields ?? true)
        : Object.fromEntries(FLAGS.map((flag) => [flag, false])) as unknown as Rules;
    return { ...base, ...Object.fromEntries(given.map((flag) => [flag, Boolean(options[flag])])) };
}

/**
 * SQL that renders a double the way `JSON.stringify` renders a JS number.
 *
 * DuckDB's `to_json` already prints the shortest digits that round-trip, as JavaScript does.
 * Four corrections make the text identical:
 *
 * - A non-finite value becomes `null`, but is not treated as nil: `DataFrame` keeps a `NaN` as
 *   a value, so its key survives null removal, and `JSON.stringify` writes `null`.
 * - `-0` becomes `0`.
 * - At or above `1e21` the exponent gets a `+`: DuckDB writes `1e21`, JavaScript `1e+21`. Both
 *   switch to exponential form at the same magnitude, and negative exponents already agree.
 * - An integral value loses its `.0` (`to_json(5.0)` is `5.0`). The digits stay DuckDB's
 *   shortest form rather than the exact value, which an integer cast would print (for
 *   example `99999999999999991611392` where JavaScript writes `99999999999999980000`).
*/
function doubleJson(accessor: string): string {
    const text = `to_json(${accessor})::VARCHAR`;
    return `CASE WHEN ${accessor} IS NULL THEN NULL`
        + ` WHEN NOT isfinite(${accessor}) THEN 'null'`
        + ` WHEN ${accessor} = 0 THEN '0'`
        + ` WHEN abs(${accessor}) >= ${EXPONENTIAL_THRESHOLD} THEN replace(${text}, 'e', 'e+')`
        + ` WHEN ${accessor} = floor(${accessor}) THEN regexp_replace(${text}, '\\.0$', '')`
        + ` ELSE ${text} END`;
}

/**
 * SQL matching `bigIntToJSON`: a number while it is a safe integer, a string once `JSON.parse`
 * would round it.
 *
 * It uses two comparisons rather than `abs(x) > MAX_SAFE`, because `abs` of the smallest BIGINT
 * overflows and would fail the whole export.
*/
function bigIntegerJson(accessor: string): string {
    return `CASE WHEN ${accessor} IS NULL THEN NULL`
        + ` WHEN ${accessor} > ${MAX_SAFE} OR ${accessor} < -${MAX_SAFE}`
        + ` THEN to_json(${accessor}::VARCHAR)::VARCHAR`
        + ` ELSE ${accessor}::VARCHAR END`;
}

/** A `{ lat, lon }` object, lat then lon as `DataFrame` has them, each rendered as JS would. */
function geoPointJson(accessor: string): string {
    const part = (name: string) => doubleJson(`${accessor}.${quoteIdentifier(name)}`);
    return `CASE WHEN ${accessor} IS NULL THEN NULL`
        + ` ELSE '{"lat":' || ${part('lat')} || ',"lon":' || ${part('lon')} || '}' END`;
}

/** An object's key, as JSON text with its colon: `"name":`. */
function keyText(name: string): string {
    return quoteLiteral(`${JSON.stringify(name)}:`);
}

function member(accessor: string, name: string): string {
    return accessor === '' ? quoteIdentifier(name) : `${accessor}.${quoteIdentifier(name)}`;
}

/**
 * Builds SQL that renders fields as JSON text, following each of `DataFrame`'s
 * `SerializeOptions` rules.
 *
 * Every value renders to JSON text, or to SQL NULL for a nil value (`DataFrame`'s `nilValue`),
 * which is omitted or written as `null` depending on where it is. The rules, with the method
 * here and the `DataFrame` code each one follows:
 *
 * - A nil top-level field is `null` under `useNullForUndefined`, otherwise omitted;
 *   `skipNilValues` has no effect at this level. `row`; `DataFrame.getRow`.
 * - A nil nested field is `null` only under `useNullForUndefined` without `skipNilValues`.
 *   `object`; `ObjectVector.toJSONCompatibleValue`.
 * - An object or row with no non-nil field is nil under `skipEmptyObjects`.
 * - An undeclared object is written as stored; only `{}` becomes nil, under
 *   `skipEmptyObjects`. `leaf`; `ObjectVector` with no child fields.
 * - In a list, nil elements are `null`, and are removed under `skipNilListValues` (or
 *   `skipNilObjectValues` for object elements). Object elements are de-duplicated under
 *   `skipDuplicateObjects`, and an empty result is nil under `skipEmptyArrays`. `list`;
 *   `ListVector.toJSONCompatibleValue`.
 * - In a tuple, nil positions are `null`, and the tuple is nil under `skipEmptyArrays` when
 *   every position is. `tuple`; `TupleVector`.
 *
 * Objects are built as text rather than with `json_object`: each member is `'"k":' || v`,
 * which is NULL when `v` is, and `concat_ws` skips NULL members, so each key is present or
 * absent per the rules in one pass.
 *
 * One `DataFrame` bug is not reproduced. Under `skipEmptyArrays`, `TupleVector` treats a
 * position as nil unless its vector has a `toJSONCompatibleValue`, which `Float`, `String`,
 * `Int`, `Boolean` and `IP` lack, so it drops `[1.5, "a"]` as empty. Here a tuple is empty
 * only when every position is nil.
*/
class Renderer {
    constructor(private readonly rules: Rules) {}

    /** A whole row: nil when every field is nil under `skipEmptyObjects`, which drops the row. */
    row(tree: Record<string, FieldNode>): string {
        const nilAsNull = this.rules.useNullForUndefined;
        return this.members(tree, '', 0, nilAsNull);
    }

    /**
     * A predicate that is true for each row the export writes, or undefined when every row is
     * written.
     *
     * It is decided from the columns' NULL structure, never from the rendered JSON: filtering
     * on the rendered row would make DuckDB render every row twice (about 2x slower), because
     * the filter's alias is inlined. It mirrors the renderer's nil rules, and
     * `serialize-options-spec.ts` checks it against `DataFrame` for all 128 option combinations.
    */
    rowFilter(tree: Record<string, FieldNode>): string | undefined {
        if (!this.rules.skipEmptyObjects) return undefined;
        return Object.values(tree)
            .map((field) => this.present(field, member('', field.name), 0))
            .join(' OR ');
    }

    /**
     * A LIST column's elements, each rendered, with NULL for a nil element and nothing removed.
     * The caller applies the nil rules as it streams, as `ListVector.getRowIterator` does.
    */
    listElements(node: FieldNode, accessor: string): string {
        const element = this.value({ ...node, isArray: false }, 'v0', 1);
        return `CASE WHEN ${accessor} IS NULL THEN NULL`
            + ` ELSE list_transform(${accessor}, lambda v0 : ${element}) END`;
    }

    /** True when a value renders as something other than nil - see {@link rowFilter}. */
    private present(node: FieldNode, accessor: string, depth: number): string {
        // an empty list or tuple is nil only under skipEmptyArrays, and whether it is empty
        // depends on its rendered elements, so this case renders it
        if (this.rules.skipEmptyArrays && (node.isArray || node.type === FieldType.Tuple)) {
            return `(${this.node(node, accessor, depth)}) IS NOT NULL`;
        }
        if (node.isArray || node.type === FieldType.Tuple) return `${accessor} IS NOT NULL`;
        if (node.children) {
            const children = Object.values(node.children)
                .map((child) => this.present(child, member(accessor, child.name), depth))
                .join(' OR ');
            return `(${accessor} IS NOT NULL AND (${children}))`;
        }
        // every other leaf is non-nil whenever it is non-NULL (including NaN, which renders as
        // `null` but is not nil), except an undeclared `{}` object under skipEmptyObjects
        if (node.type === FieldType.Object) return `(${this.leaf(node, accessor)}) IS NOT NULL`;
        return `${accessor} IS NOT NULL`;
    }

    private node(node: FieldNode, accessor: string, depth: number): string {
        if (node.isArray) return this.list(node, accessor, depth);
        return this.value(node, accessor, depth);
    }

    private value(node: FieldNode, accessor: string, depth: number): string {
        if (node.type === FieldType.Tuple && node.children) {
            return this.tuple(node.children, accessor, depth);
        }
        if (node.children) return this.object(node.children, accessor, depth);
        return this.leaf(node, accessor);
    }

    private object(children: Record<string, FieldNode>, accessor: string, depth: number): string {
        const nilAsNull = this.rules.useNullForUndefined && !this.rules.skipNilValues;
        return `CASE WHEN ${accessor} IS NULL THEN NULL`
            + ` ELSE ${this.members(children, accessor, depth, nilAsNull)} END`;
    }

    /** `{...}` of some fields, or NULL when `skipEmptyObjects` and none is non-nil. */
    private members(
        fields: Record<string, FieldNode>,
        accessor: string,
        depth: number,
        nilAsNull: boolean
    ): string {
        const values = Object.values(fields).map((field) => ({
            field,
            value: this.node(field, member(accessor, field.name), depth),
        }));
        // `'"k":' || v` is NULL exactly when `v` is nil, because `||` propagates NULL, so each
        // value is rendered once. Testing `v IS NOT NULL` first would render it twice, and
        // nesting would compound that at every level.
        const present = values.map(({ field, value }) => `${keyText(field.name)} || (${value})`);
        const parts = nilAsNull
            ? present.map((part, i) => (
                `coalesce(${part}, ${quoteLiteral(`${JSON.stringify(values[i].field.name)}:null`)})`
            ))
            : present;
        const inner = `concat_ws(',', ${parts.join(', ')})`;

        if (!this.rules.skipEmptyObjects) return `'{' || ${inner} || '}'`;
        // with nil members omitted, an object with no non-nil member has an empty member list:
        // `nullif` turns it into NULL and `||` propagates that, still in one pass
        if (!nilAsNull) return `'{' || nullif(${inner}, '') || '}'`;

        // nil members written as null and empty objects dropped: the one combination that has
        // to evaluate the values twice
        const empty = values.map(({ value }) => `(${value}) IS NULL`).join(' AND ');
        return `CASE WHEN ${empty} THEN NULL ELSE '{' || ${inner} || '}' END`;
    }

    private tuple(positions: Record<string, FieldNode>, accessor: string, depth: number): string {
        const values = Object.values(positions)
            .sort((a, b) => Number(a.name) - Number(b.name))
            .map((node) => this.node(node, member(accessor, node.name), depth));
        const body = `'[' || concat_ws(',', ${values.map((v) => `coalesce(${v}, 'null')`).join(', ')}) || ']'`;
        const whole = this.rules.skipEmptyArrays
            ? `CASE WHEN ${values.map((v) => `(${v}) IS NULL`).join(' AND ')} THEN NULL ELSE ${body} END`
            : body;
        return `CASE WHEN ${accessor} IS NULL THEN NULL ELSE ${whole} END`;
    }

    /**
     * A LIST. The lambda variable is named per nesting depth, so a list nested inside another
     * list never shadows the outer binding. It uses `lambda x : ...` rather than `x -> ...`,
     * because DuckDB v2.0 disables the arrow syntax by default and v2.1 removes it.
    */
    private list(node: FieldNode, accessor: string, depth: number): string {
        const v = `v${depth}`;
        const element = this.value({ ...node, isArray: false }, v, depth + 1);
        const isObject = node.type === FieldType.Object;

        let items = `list_transform(${accessor}, lambda ${v} : ${element})`;
        items = this.rules.skipNilListValues || (isObject && this.rules.skipNilObjectValues)
            ? `list_filter(${items}, lambda ${v} : ${v} IS NOT NULL)`
            : `list_transform(${items}, lambda ${v} : coalesce(${v}, 'null'))`;
        if (this.rules.skipDuplicateObjects && isObject) {
            // first occurrence wins, as `dedupeValues` keeps it; lists are small
            items = `list_filter(${items}, lambda ${v}, ${v}i : list_position(${items}, ${v}) = ${v}i)`;
        }

        const body = `'[' || array_to_string(${items}, ',') || ']'`;
        const whole = this.rules.skipEmptyArrays
            ? `CASE WHEN len(${items}) = 0 THEN NULL ELSE ${body} END`
            : body;
        return `CASE WHEN ${accessor} IS NULL THEN NULL ELSE ${whole} END`;
    }

    /** One scalar - or an undeclared object, `Any` or shape, written as it is stored. */
    private leaf(node: FieldNode, accessor: string): string {
        // toISO8601 of `{ ms, tz_offset }` - see `date-value.ts`
        if (node.type === FieldType.Date) return dateJson(accessor);
        // a Boundary is stored as `STRUCT(lat, lon)[]`, and `GeoBoundaryVector` writes it as
        // is, so none of the list rules apply to it
        if (node.type === FieldType.Boundary) {
            return `CASE WHEN ${accessor} IS NULL THEN NULL ELSE '[' || array_to_string(`
                + `list_transform(${accessor}, lambda p : ${geoPointJson('p')}), ',') || ']' END`;
        }
        if (GEO_POINT_TYPES.has(node.type)) return geoPointJson(accessor);
        if (node.type === FieldType.GeoJSON) {
            // a GEOMETRY, which needs the `spatial` extension. `1` renders as `1.0`, which is
            // the same number
            return `ST_AsGeoJSON(${accessor})::VARCHAR`;
        }
        if (DOUBLE_TYPES.has(node.type)) return doubleJson(accessor);
        if (BIG_INTEGER_TYPES.has(node.type)) return bigIntegerJson(accessor);
        if (node.type === FieldType.Object && this.rules.skipEmptyObjects) {
            // an undeclared object is JSON text, copied as `{ ...value }`; only `{}` is dropped
            return `CASE WHEN json_type(${accessor}) = 'OBJECT' AND len(json_keys(${accessor})) = 0`
                + ` THEN NULL ELSE ${accessor}::VARCHAR END`;
        }
        return `to_json(${accessor})::VARCHAR`;
    }
}

/**
 * SQL rendering one LIST column's elements as JSON text (see `TealFrame.listValues`), and
 * whether the elements are objects, which decides whether `skipNilObjectValues` applies.
*/
export function buildJsonListElements(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    column: string,
    options: JsonExportOptions = {}
): { sql: string; isObject: boolean } {
    const node = buildTree((config.fields ?? {}) as DataTypeFields)[column];
    if (node == null || !node.isArray) {
        throw new TypeError(`Column "${column}" is not a list in this frame's config`);
    }
    return {
        sql: new Renderer(resolveRules(options)).listElements(node, quoteIdentifier(column)),
        isObject: node.type === FieldType.Object,
    };
}

/**
 * The predicate for the rows an export writes, or undefined when it writes all of them. It is
 * separate from {@link buildJsonExpression} so the filter never evaluates the rendered row.
*/
export function buildJsonRowFilter(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    options: JsonExportOptions = {}
): string | undefined {
    const tree = buildTree((config.fields ?? {}) as DataTypeFields);
    return new Renderer(resolveRules(options)).rowFilter(tree);
}

/**
 * A SQL expression producing one JSON string per row, byte-identical to `DataFrame.toJSON` with
 * the same options, or NULL for a row that `skipEmptyObjects` drops.
 *
 * Two things are left to the caller: removing duplicate rows under `skipDuplicateObjects`,
 * which compares whole rendered rows in order and is done on the stream (`TealFrame.ndjson`),
 * and filtering rows, which uses {@link buildJsonRowFilter}.
*/
export function buildJsonExpression(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    options: JsonExportOptions = {}
): string {
    const tree = buildTree((config.fields ?? {}) as DataTypeFields);
    if (Object.keys(tree).length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }
    return new Renderer(resolveRules(options)).row(tree);
}
