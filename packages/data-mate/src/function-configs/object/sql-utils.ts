import { FieldType } from '@terascope/types';
import { isObjectEntity } from '@terascope/core-utils';
import { coerceToType } from '../../builder/type-coercion.js';
import { DataTypeFieldAndChildren } from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';

/**
 * `lookup` as a `CASE` over its constant table.
 *
 * core-utils' `lookup` is `table[key]`, so the SQL follows JavaScript's property-access rules:
 *
 * - Object keys are strings. A number column matches the key equal to `String(value)`: `8910` finds
 *   `"8910"` and `1.5` finds `"1.5"`, while `"01"` and `"1.50"` match nothing. An integer column (a
 *   `bigint` in JavaScript) matches only plain integer keys, exactly, including values past 2^53.
 * - An array table is indexed by number, so it is only handled for a number column.
 * - `table[key]` also finds inherited properties such as `toString`, `constructor` and `__proto__`.
 *   For a string column those values are sent to the UDF.
 * - A string table (`"1:foo\n2:bar"`) is parsed by a helper core-utils does not export, so it keeps
 *   the UDF.
 *
 * Each table value is written as the JSON text the UDF would store for it, using the same
 * `coerceToType` and `JSON.stringify`.
*/

const INTEGER_TYPES: ReadonlySet<string> = new Set([
    FieldType.Integer, FieldType.Long, FieldType.Short, FieldType.Byte,
]);
const DOUBLE_TYPES: ReadonlySet<string> = new Set([
    FieldType.Number, FieldType.Float, FieldType.Double,
]);

/** Names `table[key]` finds on every object without them being keys. */
const INHERITED = Object.getOwnPropertyNames(Object.prototype);

const toAny = coerceToType({ type: FieldType.Any });

type Entry = readonly [key: string, value: unknown];

/** The table as key/value pairs, or undefined for a shape the SQL path does not handle. */
function entries(table: unknown, numeric: boolean): Entry[] | undefined {
    if (Array.isArray(table)) {
        return numeric ? table.map((value, index) => [String(index), value]) : undefined;
    }
    if (isObjectEntity(table)) return Object.entries(table as Record<string, unknown>);
    return undefined;
}

function columnKind(inputConfig: DataTypeFieldAndChildren): 'integer' | 'double' | 'string' {
    const type = String(inputConfig.field_config.type);
    if (INTEGER_TYPES.has(type)) return 'integer';
    if (DOUBLE_TYPES.has(type)) return 'double';
    return 'string';
}

/** Whether the SQL path handles this table and column. */
export function lookupApplies(table: unknown, inputConfig: DataTypeFieldAndChildren): boolean {
    if (inputConfig.field_config.array) return false;
    return entries(table, columnKind(inputConfig) !== 'string') !== undefined;
}

/** A table value as the JSON text the UDF path stores for an `Any` result. */
function jsonValue(value: unknown): string {
    const coerced = value == null ? null : toAny(value);
    if (coerced == null) return 'NULL';
    return `CAST(${sqlLiteral(JSON.stringify(coerced))} AS JSON)`;
}

/** The condition under which `table[value]` is `table[key]`, or undefined when it never is. */
function condition(value: string, key: string, kind: 'integer' | 'double' | 'string'): string | undefined {
    if (kind === 'string') return `${value} = ${sqlLiteral(key)}`;

    if (kind === 'integer') {
        // `String(bigint)` is plain decimal digits, so only a canonical integer key can match
        return /^-?\d+$/.test(key) && BigInt(key).toString() === key
            ? `${value} = ${key}`
            : undefined;
    }

    const number = Number(key);
    if (String(number) !== key) return undefined;
    if (Number.isNaN(number)) return `isnan(${value})`;
    if (!Number.isFinite(number)) return `${value} = CAST('${key}' AS DOUBLE)`;
    return `${value} = ${key}`;
}

export function lookupSQL(
    value: string,
    table: unknown,
    inputConfig: DataTypeFieldAndChildren,
    udf: (value: string) => string
): string {
    const kind = columnKind(inputConfig);
    const branches = (entries(table, kind !== 'string') ?? [])
        .map(([key, entry]) => {
            const when = condition(value, key, kind);
            return when == null ? undefined : `WHEN ${when} THEN ${jsonValue(entry)}`;
        })
        .filter((branch): branch is string => branch != null);

    if (kind === 'string') {
        const inherited = INHERITED.map((name) => sqlLiteral(name)).join(', ');
        branches.unshift(`WHEN ${value} IN (${inherited}) THEN ${udf(value)}`);
    }
    if (branches.length === 0) return 'CAST(NULL AS JSON)';
    return `CASE ${branches.join(' ')} ELSE NULL END`;
}
