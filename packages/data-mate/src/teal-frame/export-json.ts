import { DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFields, FieldType } from '@terascope/types';
import { quoteIdentifier, quoteLiteral } from '@terascope/sql-builder';
import { SerializeOptions } from '../vector/interfaces.js';
import { dateOffsetJson } from './date-offset.js';

/**
 * Builds the SQL that renders a frame's rows as JSON **byte-identical to what `DataFrame`
 * produces**.
 *
 * DuckDB's own `to_json` is NOT that, and shipping it would silently change the output format.
 * Measured against `DataFrame.toJSON` with the options spaces actually uses
 * (`qpl-engine/src/v3/execute/run.ts:174`), these things diverge:
 *
 * | | `DataFrame` | DuckDB native |
 * |---|---|---|
 * | `Date` | `"2026-01-10T00:00:00.000Z"` (`toISO8601`) | `"2026-01-10 00:00:00"` |
 * | `Long` past `MAX_SAFE_INTEGER` | a STRING | a number `JSON.parse` rounds |
 * | a nil field, element or empty object | per `SerializeOptions`, see `Renderer` | `null` |
 * | an integral float | `5` | `5.0` |
 * | `-0` | `0` | `-0.0` |
 * | a non-finite float | `null` | `Infinity` - **not valid JSON at all** |
 *
 * The null one is the widest, and it is not one rule but seven options - `DataFrame`'s
 * `SerializeOptions`, which spaces sets from `remove_null_fields` (`run.ts:174`; true by default,
 * false via `@preserveNullFields`). Every record with a nullable field would otherwise differ.
 *
 * The non-finite one is the only one that is not merely cosmetic - DuckDB writes a bare
 * `Infinity`/`NaN` token that `JSON.parse` rejects, so one infinite value would make a whole
 * exported line unreadable.
 *
 * All of them are corrected HERE, in SQL, before anything is written - so the export stays inside
 * DuckDB and no file needs post-processing.
 *
 * **One known residue.** At `abs(x) >= 1e21` both engines switch to exponential form, but
 * `JSON.stringify` writes `1e+21` where DuckDB writes `1e21`. That cannot be corrected through
 * the JSON type, which re-normalises any number it is given (`CAST('1e+21' AS JSON)` renders back
 * as `1e21`). Negative exponents already agree, because they carry their sign. **Now fixable
 * cheaply** - rows are built as text since 2026-09-29, so a `CASE WHEN abs(x) >= 1e21` rewrite of
 * that one branch would do it - but not done: it is number formatting, not fields and nulls.
*/

/** Above this, `bigIntToJSON` switches to a string, because `JSON.parse` would round it. */
const MAX_SAFE = '9007199254740991';

/**
 * The magnitude at which `JSON.stringify` switches a number to exponential form.
 *
 * Below it, an integral double must be written WITHOUT a decimal point (`5`, not `5.0`); at or
 * above it, the exponential rendering is left to DuckDB - see the residue note above.
*/
const EXPONENTIAL_THRESHOLD = '1e21';

/** `toISO8601`'s shape. `%g` is milliseconds; `strftime` returns NULL for NULL. */
const ISO8601 = '%Y-%m-%dT%H:%M:%S.%gZ';

/** Integer-ish types stored wide enough to exceed `MAX_SAFE_INTEGER`. */
const BIG_INTEGER_TYPES: ReadonlySet<string> = new Set([
    FieldType.Long, FieldType.Integer,
]);

/**
 * Types stored as a DuckDB `DOUBLE`.
 *
 * `Float` is included deliberately: it maps to DOUBLE, not FLOAT, because the value is a JS
 * number - see `data-types`' `float.ts`.
*/
const DOUBLE_TYPES: ReadonlySet<string> = new Set([
    FieldType.Float, FieldType.Double, FieldType.Number, FieldType.Vector,
]);

/** Types stored as a `STRUCT(lat DOUBLE, lon DOUBLE)`, whose members need the double treatment. */
const GEO_POINT_TYPES: ReadonlySet<string> = new Set([
    FieldType.Geo, FieldType.GeoPoint,
]);

/**
 * How an export renders fields and nulls: `DataFrame`'s own `SerializeOptions`, with the same
 * meaning, plus spaces' one flag as a shorthand for its two presets. See {@link resolveRules}.
*/
export interface JsonExportOptions extends SerializeOptions {
    /**
     * spaces' `remove_null_fields` - which defaults to **true**; `@preserveNullFields` is what
     * sets it to false. Selects that preset; explicit flags override it.
    */
    removeNullFields?: boolean;
}

/** A field's declared config plus any dot-notation children, resolved together. */
interface FieldNode {
    name: string;
    type: string;
    isArray: boolean;
    /** A `Date` stored as `STRUCT(ts, tz_offset)` - see `date-offset.ts`. */
    dateOffset?: boolean;
    children?: Record<string, FieldNode>;
}

/**
 * Folds the flat, dot-notation `DataTypeConfig` into a tree.
 *
 * The config declares `metadata` and `metadata.source` as siblings; a JSON value needs them
 * nested, and needs to recurse - a `Date` three levels down is still rendered SQL-shaped by
 * `to_json` and still has to be corrected.
*/
function buildTree(
    fields: DataTypeFields,
    dateOffsetColumns: ReadonlySet<string> = new Set()
): Record<string, FieldNode> {
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
            node.dateOffset = parts.length === 1 && dateOffsetColumns.has(path);
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
 * spaces' two presets, from its one flag (`qpl-engine/src/v3/execute/run.ts:174`):
 * `remove_null_fields` true is the default, false is `@preserveNullFields`.
*/
function spacesPreset(removeNullFields: boolean): Rules {
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
 * The rules an export follows.
 *
 * **Any flag given means `DataFrame.toJSON`'s semantics exactly**: an unset flag is false, as it is
 * there. `removeNullFields` selects one of spaces' presets, and explicit flags override it; with
 * NEITHER, the default is spaces' own - `remove_null_fields` true - because that is what every
 * caller of this means by "the output".
*/
export function resolveRules(options: JsonExportOptions = {}): Rules {
    const given = FLAGS.filter((flag) => options[flag] != null);
    const usePreset = options.removeNullFields != null || given.length === 0;
    const base: Rules = usePreset
        ? spacesPreset(options.removeNullFields ?? true)
        : Object.fromEntries(FLAGS.map((flag) => [flag, false])) as unknown as Rules;
    return { ...base, ...Object.fromEntries(given.map((flag) => [flag, Boolean(options[flag])])) };
}

/**
 * `JSON.stringify`'s rendering of a JS number, in SQL.
 *
 * DuckDB's `to_json` already prints the SHORTEST digits that round-trip, as JavaScript does
 * (`docs/tools/probe/double-exponent-format.mjs`); four corrections make the text the same:
 *
 * - **non-finite becomes `null` - and is NOT nil.** `FloatVector` has no `toJSONCompatibleValue`,
 *   so `DataFrame` keeps a `NaN` as a value (its key survives null removal) and `JSON.stringify`
 *   writes `null`. DuckDB would write a bare `Infinity`/`NaN`, which is not valid JSON at all.
 * - **`-0` becomes `0`.**
 * - **past `1e21` the exponent gets its `+`**: DuckDB writes `1e21`, JavaScript `1e+21`. Both
 *   switch to exponential form at the same magnitude, and negative exponents already agree.
 * - **an integral value loses its `.0`**: `to_json(5.0)` is `5.0`. The digits are DuckDB's shortest
 *   form, NOT the exact value - the HUGEINT cast this used before wrote `99999999999999991611392`
 *   for the double JavaScript writes as `99999999999999980000`.
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
 * `bigIntToJSON`: a number while it fits, a string once `JSON.parse` would round it.
 *
 * **Two comparisons, not `abs(x) > MAX_SAFE`.** A Long is a BIGINT, and `abs` of the int64 minimum
 * has no BIGINT result - DuckDB raises `Overflow on abs(-9223372036854775808)` and the whole export
 * fails on one row.
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
 * Renders fields as JSON TEXT, following `DataFrame`'s `SerializeOptions` rule for rule.
 *
 * Every value renders to JSON text, or to SQL NULL for **nil** - `DataFrame`'s `nilValue`, a value
 * that is either omitted or written as `null` depending on where it sits. Where each rule lives in
 * `DataFrame`, so they can be checked against it:
 *
 * - **A nil TOP-LEVEL field** is `null` if `useNullForUndefined`, else omitted - `skipNilValues`
 *   has NO effect at this level. `row`; `DataFrame.getRow` / `_getRowOptimized`.
 * - **A nil NESTED field** is `null` only if `useNullForUndefined` AND NOT `skipNilValues`.
 *   `object`; `ObjectVector.toJSONCompatibleValue`.
 * - **An object, or a row, with no non-nil field** is nil under `skipEmptyObjects`. Both.
 * - **An undeclared object** is written as it was stored; only `{}` becomes nil, under
 *   `skipEmptyObjects`. `leaf`; `ObjectVector` with no child fields.
 * - **A list**: nil elements are `null`, filtered under `skipNilListValues` - or, for OBJECT
 *   elements, `skipNilObjectValues`; object elements are de-duplicated under
 *   `skipDuplicateObjects`; an empty result is nil under `skipEmptyArrays`. `list`;
 *   `ListVector.toJSONCompatibleValue`.
 * - **A tuple**: nil positions are `null`; nil under `skipEmptyArrays` when EVERY position is.
 *   `tuple`; `TupleVector` - see its defect below.
 *
 * **Text, not `json_object`.** A member is `CASE WHEN v IS NOT NULL THEN '"k":' || v END`, and
 * `concat_ws` skips a NULL member, so a key is present or absent per the rules without a second
 * pass. The previous `json_merge_patch('{}', ...)` could only strip EVERY null key, which is right
 * for neither preset in every place.
 *
 * **One `DataFrame` defect is not reproduced**: under `skipEmptyArrays` `TupleVector` counts a
 * position as non-nil only if its vector has a `toJSONCompatibleValue`, which `Float`, `String`,
 * `Int`, `Boolean` and `IP` do not - so it drops `[1.5, "a"]` as "empty". Here a tuple is empty
 * only when every position is nil. No spaces preset sets `skipEmptyArrays`.
*/
class Renderer {
    constructor(private readonly rules: Rules) {}

    /** A whole row: nil when every field is nil under `skipEmptyObjects`, which drops the row. */
    row(tree: Record<string, FieldNode>): string {
        const nilAsNull = this.rules.useNullForUndefined;
        return this.members(tree, '', 0, nilAsNull);
    }

    /**
     * A predicate true for a row this export writes, or undefined when every row is written.
     *
     * **Decided from the columns' NULL structure, never from the rendered JSON.** Filtering on the
     * rendered row made DuckDB render it twice - the filter's alias is inlined - which measured
     * 2x slower on 1M rows. This reads only NULL flags and struct members, and rendering then runs
     * for the rows that survive. It mirrors the renderer's nil rules, and
     * `serialize-options-spec.ts` compares the result with `DataFrame` across all 128 option sets.
    */
    rowFilter(tree: Record<string, FieldNode>): string | undefined {
        if (!this.rules.skipEmptyObjects) return undefined;
        return Object.values(tree)
            .map((field) => this.present(field, member('', field.name), 0))
            .join(' OR ');
    }

    /**
     * A LIST column's elements, each rendered - NULL for a nil one, nothing filtered - for
     * `ListVector.getRowIterator`, which applies its own nil rule as it streams.
    */
    listElements(node: FieldNode, accessor: string): string {
        const element = this.value({ ...node, isArray: false }, 'v0', 1);
        return `CASE WHEN ${accessor} IS NULL THEN NULL`
            + ` ELSE list_transform(${accessor}, lambda v0 : ${element}) END`;
    }

    /** True when a value renders as something other than nil - see {@link rowFilter}. */
    private present(node: FieldNode, accessor: string, depth: number): string {
        // an empty list or tuple is nil only under skipEmptyArrays, and whether it is empty
        // depends on its rendered elements - so that one rule asks the renderer
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
        // every other leaf renders non-nil whenever it is non-NULL - a NaN included, which is
        // `null` but not nil - except an undeclared object that is `{}` under skipEmptyObjects
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
        // `'"k":' || v` is NULL exactly when `v` is nil - `||` propagates NULL - so each value is
        // rendered ONCE. Testing `v IS NOT NULL` first renders it twice, and nesting compounds
        // that at every level: measured 2x slower on 1M rows.
        const present = values.map(({ field, value }) => `${keyText(field.name)} || (${value})`);
        const parts = nilAsNull
            ? present.map((part, i) => (
                `coalesce(${part}, ${quoteLiteral(`${JSON.stringify(values[i].field.name)}:null`)})`
            ))
            : present;
        const inner = `concat_ws(',', ${parts.join(', ')})`;

        if (!this.rules.skipEmptyObjects) return `'{' || ${inner} || '}'`;
        // with nil members omitted, "no non-nil member" is an empty member list: `nullif` makes
        // it NULL and `||` carries that out, still in one pass
        if (!nilAsNull) return `'{' || nullif(${inner}, '') || '}'`;

        // nil members written as null AND empty objects dropped - no spaces preset does this, and
        // it is the one case that has to look at the values twice
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
     * A LIST. `variable` is unique per nesting depth, so a list inside an object inside a list
     * never shadows the outer lambda's binding. **`lambda x : ...`, never `x -> ...`**: DuckDB v2.0
     * disables the single-arrow syntax by default and v2.1 removes the flag that restores it.
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
        if (node.type === FieldType.Date && node.dateOffset) return dateOffsetJson(accessor);
        if (node.type === FieldType.Date) {
            // toISO8601, not DuckDB's SQL rendering; strftime of NULL is NULL
            return `to_json(strftime(${accessor}, ${quoteLiteral(ISO8601)}))::VARCHAR`;
        }
        // a Boundary is ITSELF `STRUCT(lat, lon)[]`, and `GeoBoundaryVector` writes it as it is -
        // none of the list rules apply to it
        if (node.type === FieldType.Boundary) {
            return `CASE WHEN ${accessor} IS NULL THEN NULL ELSE '[' || array_to_string(`
                + `list_transform(${accessor}, lambda p : ${geoPointJson('p')}), ',') || ']' END`;
        }
        if (GEO_POINT_TYPES.has(node.type)) return geoPointJson(accessor);
        if (node.type === FieldType.GeoJSON) {
            // a GEOMETRY. `1` renders as `1.0` - the same number, accepted. Needs `spatial`
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
 * A SQL expression producing ONE JSON string per row, byte-identical to `DataFrame.toJSON` with the
 * same options - or NULL for a row `skipEmptyObjects` drops, which the caller filters out.
 *
 * `skipDuplicateObjects` on ROWS is not in here: it compares whole rendered rows in order, which
 * the caller does on the stream (`TealFrame.ndjson`), exactly as `rowsWithoutDuplicates` does.
 * Nor is the row filter - see {@link buildJsonRowFilter}.
*/
/**
 * One LIST column's elements rendered as JSON text - see `TealFrame.listValues` - and whether they
 * are objects, which decides the `skipNilObjectValues` rule.
*/
export function buildJsonListElements(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    column: string,
    options: JsonExportOptions = {},
    dateOffsetColumns?: ReadonlySet<string>
): { sql: string; isObject: boolean } {
    const node = buildTree((config.fields ?? {}) as DataTypeFields, dateOffsetColumns)[column];
    if (node == null || !node.isArray) {
        throw new TypeError(`Column "${column}" is not a list in this frame's config`);
    }
    return {
        sql: new Renderer(resolveRules(options)).listElements(node, quoteIdentifier(column)),
        isObject: node.type === FieldType.Object,
    };
}

/**
 * The predicate for rows the export writes, or undefined when it writes all of them. Kept apart
 * from {@link buildJsonExpression} so the filter never has to evaluate the rendered row.
*/
export function buildJsonRowFilter(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    options: JsonExportOptions = {}
): string | undefined {
    const tree = buildTree((config.fields ?? {}) as DataTypeFields);
    return new Renderer(resolveRules(options)).rowFilter(tree);
}

export function buildJsonExpression(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    options: JsonExportOptions = {},
    dateOffsetColumns?: ReadonlySet<string>
): string {
    const tree = buildTree((config.fields ?? {}) as DataTypeFields, dateOffsetColumns);
    if (Object.keys(tree).length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }
    return new Renderer(resolveRules(options)).row(tree);
}
