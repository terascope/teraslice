import {
    DataTypeFieldConfig, DataTypeFields, FieldType, ReadonlyDataTypeFields
} from '@terascope/types';
import { quoteIdentifier } from '@terascope/sql-builder';
import { getChildDataTypeConfig } from '../core/utils.js';
import { FrameConfig } from './interfaces.js';

/**
 * `DataFrame.deepSelect` as SQL: keeps the selected fields, in the selected shape.
 *
 * It is used wherever a result must take the shape of a GraphQL selection set. The rules match
 * `DataFrame`:
 *
 * - A selector is a field or a dotted path. `'config.owner.name'` keeps `config` with only that
 *   member, plus every Object on the way down (`Column.selectSubFields`).
 * - A selector naming an Object takes all its children, unless the Object is `_allow_empty`
 *   (a joined field), in which case it takes the Object alone.
 * - An Object left with no selected children becomes `{}` if it is `_allow_empty`, and keeps its
 *   whole value otherwise (`coerceToObject`). Either way it has no declared children left, so it
 *   becomes a JSON column, which also lets `pruneEmptyObjects` find it.
 * - A selector that matches nothing is ignored. Columns come out in config order, not selector
 *   order. Selecting nothing returns no columns and no rows.
 * - A null object stays null, and an array of objects is trimmed element by element, keeping null
 *   elements. sql-builder's `projection` cannot be used here: its `struct_pack` turns a null
 *   struct into a struct of nulls, and it cannot reach inside a list.
*/

type Fields = DataTypeFields | ReadonlyDataTypeFields;

/** Extra flags a caller may set on a field config; not part of the public type. */
interface EngineFlags {
    _allow_empty?: boolean;
}

function allowsEmpty(config: DataTypeFieldConfig | undefined): boolean {
    return (config as EngineFlags | undefined)?._allow_empty === true;
}

function isObject(config: DataTypeFieldConfig | undefined): boolean {
    return config?.type === FieldType.Object;
}

/** Maps each matched top-level column to the child paths kept under it, in config order. */
function match(fields: Fields, selectors: readonly string[]): Map<string, Set<string>> {
    const matched = new Map<string, Set<string>>();

    for (const field of Object.keys(fields)) {
        const selected = selectors.some((selector) => field === selector
            || (field.startsWith(`${selector}.`) && !allowsEmpty(fields[selector])));
        if (!selected) continue;

        const [base] = field.split('.', 1);
        if (!matched.has(base)) matched.set(base, new Set());
        if (field !== base) matched.get(base)!.add(field.slice(base.length + 1));
    }
    return matched;
}

/** Like `selectSubFields`: the selected child paths, plus every Object above one of them. */
function keptChildren(children: Fields, selected: ReadonlySet<string>): Set<string> {
    const kept = new Set<string>();
    for (const path of selected) {
        if (children[path]) kept.add(path);
        let parent = '';
        for (const part of path.split('.')) {
            parent = parent ? `${parent}.${part}` : part;
            if (isObject(children[parent])) kept.add(parent);
        }
    }
    return kept;
}

/** The paths directly or indirectly under `member`, relative to it. */
function under(paths: Iterable<string>, member: string): Set<string> {
    const prefix = `${member}.`;
    return new Set([...paths]
        .filter((path) => path.startsWith(prefix))
        .map((path) => path.slice(prefix.length)));
}

/** Applies `one` to the value, or to each element when it is a list; null stays null. */
function each(expression: string, array: boolean, one: (value: string) => string): string {
    if (!array) return one(expression);
    return `CASE WHEN ${expression} IS NULL THEN NULL`
        + ` ELSE list_transform(${expression}, lambda x : ${one('x')}) END`;
}

/**
 * SQL that narrows an Object value to the `kept` paths (relative to it). Returns the value
 * unchanged when nothing is dropped.
*/
function narrow(
    expression: string,
    config: DataTypeFieldConfig,
    children: Fields,
    kept: ReadonlySet<string>
): string {
    const all = Object.keys(children);
    if (all.length === 0 || all.every((path) => kept.has(path))) return expression;

    const array = config.array === true;
    if (kept.size === 0) {
        return each(expression, array, (value) => `CASE WHEN ${value} IS NULL THEN NULL ELSE ${
            allowsEmpty(config) ? 'CAST(\'{}\' AS JSON)' : `CAST(to_json(${value}) AS JSON)`
        } END`);
    }

    const members = [...kept].filter((path) => !path.includes('.'));
    return each(expression, array, (value) => {
        const packed = members.map((member) => {
            const ref = `${value}.${quoteIdentifier(member)}`;
            const memberConfig = children[member];
            const memberChildren = isObject(memberConfig)
                ? getChildDataTypeConfig(children as DataTypeFields, member, FieldType.Object) ?? {}
                : {};
            return `${quoteIdentifier(member)} := ${
                narrow(ref, memberConfig, memberChildren, under(kept, member))
            }`;
        });
        return `CASE WHEN ${value} IS NULL THEN NULL ELSE struct_pack(${packed.join(', ')}) END`;
    });
}

export function deepSelectSQL(
    from: string,
    columns: readonly string[],
    config: FrameConfig,
    selectors: readonly string[]
): { sql: string; config: FrameConfig; columns: string[] } {
    const fields = (config.fields ?? {}) as Fields;
    const matched = [...match(fields, selectors)].filter(([base]) => columns.includes(base));

    if (matched.length === 0) {
        return { sql: `SELECT * FROM ${from} LIMIT 0`, config: { ...config, fields: {} }, columns: [] };
    }

    const list: string[] = [];
    const fieldsOut: DataTypeFields = {};
    for (const [base, selected] of matched) {
        const baseConfig = fields[base];
        const children = isObject(baseConfig)
            ? getChildDataTypeConfig(fields as DataTypeFields, base, FieldType.Object) ?? {}
            : {};
        const kept = keptChildren(children, selected);
        const all = Object.keys(children);
        const whole = all.length === 0 || all.every((path) => kept.has(path));

        const ref = quoteIdentifier(base);
        list.push(whole ? ref : `${narrow(ref, baseConfig, children, kept)} AS ${ref}`);

        fieldsOut[base] = baseConfig;
        for (const path of whole ? all : kept) fieldsOut[`${base}.${path}`] = children[path];
    }

    return {
        sql: `SELECT ${list.join(', ')} FROM ${from}`,
        config: { ...config, fields: fieldsOut },
        columns: matched.map(([base]) => base),
    };
}

/**
 * Implements the `@skipIfEmpty` GraphQL directive: an Object column marked `_skip_if_empty`
 * is dropped once `deepSelect` has removed all of its declared children.
*/
function isEmptyObject(fields: Fields, name: string): boolean {
    const children = getChildDataTypeConfig(fields as DataTypeFields, name, FieldType.Object);
    return Object.keys(children ?? {}).length === 0;
}

export function emptySkippedObjects(config: FrameConfig): string[] {
    const fields = (config.fields ?? {}) as Fields;
    return Object.entries(fields)
        .filter(([name, field]) => !name.includes('.')
            && (field as { _skip_if_empty?: boolean })._skip_if_empty === true
            && isObject(field)
            && isEmptyObject(fields, name))
        .map(([name]) => name);
}
