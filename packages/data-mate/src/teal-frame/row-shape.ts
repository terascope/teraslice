import {
    DataTypeConfig, DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeConfig,
    ReadonlyDataTypeFields, FieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { parseJSONText } from './plain-values.js';
import { renderPlainDate } from './date-value.js';

/**
 * Shapes `rows()` output where the right shape depends on the field config, not the value.
 *
 * - `toPlainValue` turns every STRUCT into an object. A `Tuple` is stored as
 *   `STRUCT("0" ..., "1" ...)` (a DuckDB LIST cannot mix element types), but `DataFrame`
 *   returns it as an array, so it is converted back.
 * - A `Date` is stored as `{ ms, tz_offset }` and rendered as `toISO8601` renders it. See
 *   `date-value.ts`.
 * - A JSON column (`Any`, or an `Object`/`Tuple` with no declared children) arrives as text and is
 *   parsed, so `{x: 1}` is returned as an object rather than the string `'{"x":1}'`.
 *
 * Shapers are built once per `rows()` call. A column that needs no shaping gets none and costs
 * nothing per row.
*/

export type ValueShaper = (value: unknown) => unknown;

/** Returns a shaper for each top-level column that needs one, keyed by column name. */
export function makeRowShapers(
    config: DataTypeConfig | ReadonlyDataTypeConfig
): ReadonlyMap<string, ValueShaper> {
    const fields = (config.fields ?? {}) as DataTypeFields;
    const shapers = new Map<string, ValueShaper>();

    for (const [name, fieldConfig] of Object.entries(fields)) {
        if (name.includes('.')) continue;
        const shaper = fieldShaper(
            fieldConfig,
            getChildDataTypeConfig(fields, name, fieldConfig.type as FieldType)
        );
        if (shaper) shapers.set(name, shaper);
    }
    return shapers;
}

function fieldShaper(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): ValueShaper | undefined {
    const element = elementShaper(fieldConfig.type as FieldType, childConfig);

    if (element == null) return undefined;
    if (!fieldConfig.array) return element;
    return (value) => (Array.isArray(value) ? value.map(element) : value);
}

/** Whether the column is stored as JSON (`toDuckDB` maps these types to `JSON`). */
export function isJSONColumn(
    type: FieldType,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): boolean {
    if (type === FieldType.Any) return true;
    if (type !== FieldType.Object && type !== FieldType.Tuple) return false;
    return childConfig == null
        || Object.keys(childConfig).every((name) => name.includes('.'));
}

function elementShaper(
    type: FieldType,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): ValueShaper | undefined {
    if (isJSONColumn(type, childConfig)) return parseJSONText;
    if (type === FieldType.Date) return renderPlainDate;
    if (type === FieldType.Tuple) return tupleShaper(childConfig);
    return objectShaper(type, childConfig);
}

/** Returns `[name, shaper]` for each direct child; the shaper is undefined when not needed. */
function childShapers(
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): [name: string, shape: ValueShaper | undefined][] {
    if (childConfig == null) return [];
    return Object.entries(childConfig)
        .filter(([name]) => !name.includes('.'))
        .map(([name, config]) => [
            name,
            fieldShaper(
                config,
                getChildDataTypeConfig(childConfig, name, config.type as FieldType)
            ),
        ]);
}

/**
 * Converts `{"0": a, "1": b}` to `[a, b]` in position order, shaping each position. A NULL
 * position stays `null` in the array, as in `DataFrame`.
*/
function tupleShaper(childConfig?: DataTypeFields | ReadonlyDataTypeFields): ValueShaper {
    const positions = childShapers(childConfig)
        .sort(([a], [b]) => Number(a) - Number(b));

    return (value) => {
        if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
        const struct = value as Record<string, unknown>;
        return positions.map(([name, shape]) => {
            const member = struct[name] ?? null;
            return shape ? shape(member) : member;
        });
    };
}

/**
 * Shapes an `Object` whose children need shaping (for example a Tuple or JSON child). Returns a
 * new object and never mutates the input.
*/
function objectShaper(
    type: FieldType,
    childConfig?: DataTypeFields | ReadonlyDataTypeFields
): ValueShaper | undefined {
    if (type !== FieldType.Object) return undefined;
    const shaped = childShapers(childConfig)
        .filter((entry): entry is [string, ValueShaper] => entry[1] != null);
    if (shaped.length === 0) return undefined;

    return (value) => {
        if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
        const copy = { ...value as Record<string, unknown> };
        for (const [name, shape] of shaped) {
            if (name in copy) copy[name] = shape(copy[name]);
        }
        return copy;
    };
}
