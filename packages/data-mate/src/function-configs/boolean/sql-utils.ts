import { FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../interfaces.js';
import {
    JS_WHITESPACE, sqlLiteral, STRING_FIELD_TYPES, NUMERIC_FIELD_TYPES,
} from '../sql-helpers.js';

/**
 * Helpers shared by the SQL expressions on the boolean function configs.
 *
 * These functions accept every type, and their result depends on the column type. Each expression
 * therefore branches on `inputConfig` rather than on the value. For example, `isBoolean` is a
 * constant `TRUE` on a `Boolean` column and `FALSE` on any other.
*/

/** The column's declared type. */
export function columnType(inputConfig: DataTypeFieldAndChildren): FieldType {
    return inputConfig.field_config.type as FieldType;
}

/** Whether the column holds real booleans, which is what `isBoolean` asks. */
export function isBooleanColumn(inputConfig: DataTypeFieldAndChildren): boolean {
    return columnType(inputConfig) === FieldType.Boolean;
}

export function isStringColumn(inputConfig: DataTypeFieldAndChildren): boolean {
    return STRING_FIELD_TYPES.includes(columnType(inputConfig));
}

/**
 * `input.trim().toLowerCase()` in SQL.
 *
 * `JS_WHITESPACE` is passed explicitly because DuckDB's one-argument `trim` strips only spaces. The
 * string is normalized before the comparison because `isTruthy` and `isFalsy` normalize first.
*/
function normalized(value: string): string {
    return `lower(trim(${value}, ${sqlLiteral(JS_WHITESPACE)}))`;
}

/**
 * The falsy check for a string column.
 *
 * The empty string is tested separately and without trimming, because `isFalsy` returns early on
 * `input === ''`. So `''` is falsy but `'   '` is not.
*/
export function stringIsFalsy(value: string): string {
    return `(${value} = '' OR ${normalized(value)} IN ('0', 'false', 'no'))`;
}

/** The `_truthy` table, for a string column. `true` itself is a boolean and cannot appear here. */
export function stringIsTruthy(value: string): string {
    return `${normalized(value)} IN ('1', 'true', 'yes')`;
}

/**
 * Whether the column holds numbers.
 *
 * Only the named numeric types count. `applies` declines anything else, so a `Date`, `GeoPoint` or
 * object column keeps the UDF.
*/
export function isNumericColumn(inputConfig: DataTypeFieldAndChildren): boolean {
    return NUMERIC_FIELD_TYPES.includes(columnType(inputConfig));
}
