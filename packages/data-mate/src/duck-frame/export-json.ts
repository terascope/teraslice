import { DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFields, FieldType } from '@terascope/types';
import { quoteIdentifier, quoteLiteral } from './sql.js';

/**
 * Builds the SQL that renders a frame's rows as JSON **byte-identical to what `DataFrame`
 * produces**.
 *
 * DuckDB's own `to_json` is NOT that, and shipping it would silently change the output format.
 * Measured against `DataFrame.toJSON` with the options spaces actually uses
 * (`qpl-engine/src/v3/execute/run.ts:174`), three things diverge:
 *
 * | | `DataFrame` | DuckDB native |
 * |---|---|---|
 * | `Date` | `"2026-01-10T00:00:00.000Z"` (`toISO8601`) | `"2026-01-10 00:00:00"` |
 * | `Long` past `MAX_SAFE_INTEGER` | a STRING | a number `JSON.parse` rounds |
 * | a null field | the key is **absent** | `"field": null` |
 *
 * The last one is the big one: spaces defaults `remove_null_fields` to true
 * (`create-execution-plan.ts:94`, off only via `@preserveNullFields`), so every record with a
 * nullable field would differ.
 *
 * All three are corrected HERE, in SQL, before anything is written - so the export stays inside
 * DuckDB and no file needs post-processing.
*/

/** Above this, `bigIntToJSON` switches to a string, because `JSON.parse` would round it. */
const MAX_SAFE = '9007199254740991';

/** `toISO8601`'s shape. `%g` is milliseconds; `strftime` returns NULL for NULL. */
const ISO8601 = '%Y-%m-%dT%H:%M:%S.%gZ';

/** Integer-ish types stored wide enough to exceed `MAX_SAFE_INTEGER`. */
const BIG_INTEGER_TYPES: ReadonlySet<string> = new Set([
    FieldType.Long, FieldType.Integer,
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

    if (BIG_INTEGER_TYPES.has(node.type) && !node.isArray) {
        // bigIntToJSON: a number while it fits, a string once it would round
        return `CASE WHEN ${accessor} IS NULL THEN NULL`
            + ` WHEN abs(${accessor}) > ${MAX_SAFE} THEN to_json(${accessor}::VARCHAR)`
            + ` ELSE to_json(${accessor}) END`;
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
