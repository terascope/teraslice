import {
    DataTypeConfig, DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeConfig,
    ReadonlyDataTypeFields, FieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { parseJSONText } from './plain-values.js';

/**
 * The output shape `rows()` cannot get from a value alone, because it depends on the CONFIG.
 *
 * `toPlainValue` turns every STRUCT into an object - right for an `Object`, wrong for a `Tuple`,
 * which is stored as `STRUCT("0" ..., "1" ...)` (a DuckDB LIST cannot hold positions of different
 * types) and which `DataFrame` yields as an ARRAY. Only the config says which STRUCT is which.
 *
 * Likewise a JSON column - `Any`, or an `Object`/`Tuple` with no declared children - reaches JS as
 * its TEXT, and `DataFrame` yields the value. Without this `{x: 1}` came out as `'{"x":1}'` and
 * `5` as `'5'` (DF20); `ndjson()` was right all along, because DuckDB splices JSON in unquoted.
 *
 * Built once per `rows()` call, per column; a column with no `Tuple` anywhere in it gets no
 * shaper and costs nothing per row.
*/

export type ValueShaper = (value: unknown) => unknown;

/** A shaper for each top-level column that needs one, keyed by column name. */
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

/** Whether the column is stored as JSON text - `toDuckDB` maps these to `JSON`. */
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
    if (type === FieldType.Tuple) return tupleShaper(childConfig);
    return objectShaper(type, childConfig);
}

/** The shapers for each declared child, by name - only the children that need one. */
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
 * `{"0": a, "1": b}` to `[a, b]`, in position order, each position shaped in turn. A position
 * DuckDB holds as NULL stays `null` inside the array, as `DataFrame` has it.
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
 * An `Object` whose declared children contain a Tuple or a JSON column somewhere; a new object,
 * never mutated.
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
