import { DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFields, FieldType } from '@terascope/types';
import { quoteIdentifier, quoteLiteral } from './sql.js';

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
 * | a null field | the key is **absent** | `"field": null` |
 * | an integral float | `5` | `5.0` |
 * | `-0` | `0` | `-0.0` |
 * | a non-finite float | `null` | `Infinity` - **not valid JSON at all** |
 *
 * The null one is the widest: spaces defaults `remove_null_fields` to true
 * (`create-execution-plan.ts:94`, off only via `@preserveNullFields`), so every record with a
 * nullable field would differ.
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
 * as `1e21`), and fixing it would mean building the whole object as text and losing
 * `json_merge_patch` for null stripping. Negative exponents already agree, because they carry
 * their sign.
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

export interface JsonExportOptions {
    /**
     * Omit null fields, matching spaces' `remove_null_fields` - which defaults to **true**.
     * `@preserveNullFields` is what sets this to false.
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
 * Folds the flat, dot-notation `DataTypeConfig` into a tree.
 *
 * The config declares `metadata` and `metadata.source` as siblings; a JSON value needs them
 * nested, and needs to recurse - a `Date` three levels down is still rendered SQL-shaped by
 * `to_json` and still has to be corrected.
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
 * Applies a per-element correction inside a LIST column, null-safe.
 *
 * `variable` is the lambda parameter, and each caller passes a DIFFERENT one so that a corrected
 * list nested inside a corrected object or list can never shadow an outer binding.
*/
function jsonList(
    accessor: string,
    variable: string,
    element: (reference: string) => string
): string {
    return `CASE WHEN ${accessor} IS NULL THEN NULL`
        + ` ELSE to_json(list_transform(${accessor}, ${variable} -> ${element(variable)})) END`;
}

/**
 * `JSON.stringify`'s rendering of a JS number, in SQL.
 *
 * Three corrections, all of them of the same value:
 *
 * - **non-finite becomes `null`**, as `JSON.stringify` does. DuckDB would write a bare
 *   `Infinity`/`NaN`, which is not valid JSON.
 * - **an integral value loses its decimal point.** `to_json(5.0::DOUBLE)` is `5.0`; JS writes
 *   `5`. Casting to `HUGEINT` (not `BIGINT` - `1e20` overflows that) and re-parsing the digits as
 *   JSON produces an unquoted integer token, verified to survive `json_merge_patch`.
 * - **`-0` becomes `0`**, which falls out of the integer cast for free.
 *
 * Anything fractional in non-exponential range already matches: both sides print the shortest
 * round-trip decimal, checked across 31 magnitudes.
*/
function doubleJson(accessor: string): string {
    return `CASE WHEN ${accessor} IS NULL OR NOT isfinite(${accessor}) THEN NULL`
        + ` WHEN ${accessor} = floor(${accessor})`
        + ` AND abs(${accessor}) < ${EXPONENTIAL_THRESHOLD}`
        + ` THEN CAST(CAST(${accessor} AS HUGEINT)::VARCHAR AS JSON)`
        + ` ELSE to_json(${accessor}) END`;
}

/** `bigIntToJSON`: a number while it fits, a string once `JSON.parse` would round it. */
function bigIntegerJson(accessor: string): string {
    return `CASE WHEN ${accessor} IS NULL THEN NULL`
        + ` WHEN abs(${accessor}) > ${MAX_SAFE} THEN to_json(${accessor}::VARCHAR)`
        + ` ELSE to_json(${accessor}) END`;
}

/** A `{ lat, lon }` object, with both members rendered as JS would render them. */
function geoPointJson(accessor: string): string {
    const member = (name: string) => doubleJson(`${accessor}.${quoteIdentifier(name)}`);

    // lat then lon, matching `DataFrame`'s key order
    return `CASE WHEN ${accessor} IS NULL THEN NULL`
        + ` ELSE json_object('lat', ${member('lat')}, 'lon', ${member('lon')}) END`;
}

/**
 * The JSON value for one field, with every divergence corrected.
 *
 * `accessor` is the SQL that reads it - a quoted column at the top level, `e."child"` inside a
 * `list_transform` lambda.
*/
function jsonValue(node: FieldNode, accessor: string): string {
    if (node.children) {
        const object = jsonObject(node.children, accessor);
        // an array of objects: correct each element, then re-wrap
        if (node.isArray) {
            return `CASE WHEN ${accessor} IS NULL THEN NULL ELSE to_json(list_transform(`
                + `${accessor}, e -> ${jsonObject(node.children, 'e')}))`
                + ' END';
        }
        return `CASE WHEN ${accessor} IS NULL THEN NULL ELSE ${object} END`;
    }

    if (node.type === FieldType.Date) {
        // toISO8601, not DuckDB's SQL rendering
        const format = quoteLiteral(ISO8601);
        return node.isArray
            ? `to_json(list_transform(${accessor}, e -> strftime(e, ${format})))`
            : `to_json(strftime(${accessor}, ${format}))`;
    }

    // a Boundary is ITSELF `STRUCT(lat, lon)[]`, so it is a list whether or not `array` is set
    if (node.type === FieldType.Boundary) {
        return jsonList(accessor, 'p', geoPointJson);
    }

    if (GEO_POINT_TYPES.has(node.type)) {
        return node.isArray
            ? jsonList(accessor, 'p', geoPointJson)
            : geoPointJson(accessor);
    }

    if (DOUBLE_TYPES.has(node.type)) {
        return node.isArray
            ? jsonList(accessor, 'n', doubleJson)
            : doubleJson(accessor);
    }

    if (BIG_INTEGER_TYPES.has(node.type)) {
        return node.isArray
            ? jsonList(accessor, 'i', bigIntegerJson)
            : bigIntegerJson(accessor);
    }

    return `to_json(${accessor})`;
}

/** `json_object('name', <value>, ...)` for a set of fields. */
function jsonObject(nodes: Record<string, FieldNode>, prefix: string): string {
    const args = Object.values(nodes).flatMap((node) => {
        const accessor = prefix === ''
            ? quoteIdentifier(node.name)
            : `${prefix}.${quoteIdentifier(node.name)}`;
        return [quoteLiteral(node.name), jsonValue(node, accessor)];
    });

    return `json_object(${args.join(', ')})`;
}

/**
 * A SQL expression producing ONE JSON string per row, matching `DataFrame`.
 *
 * Null stripping is `json_merge_patch('{}', ...)`, which is RFC 7396 merge-patch: applying a
 * patch onto an empty object treats a null as "delete", so null keys never appear - and it
 * recurses, so a null inside a nested object goes too (verified). DuckDB has no
 * `json_strip_nulls`; the alternative, filtering a MAP of entries, measured 2.6x slower.
*/
export function buildJsonExpression(
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    options: JsonExportOptions = {}
): string {
    const tree = buildTree((config.fields ?? {}) as DataTypeFields);
    if (Object.keys(tree).length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }

    const object = jsonObject(tree, '');
    const removeNulls = options.removeNullFields ?? true;

    return removeNulls
        ? `json_merge_patch('{}', ${object})::VARCHAR`
        : `${object}::VARCHAR`;
}
