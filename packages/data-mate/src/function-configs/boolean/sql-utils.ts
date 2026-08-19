import { FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../interfaces.js';
import {
    JS_WHITESPACE, sqlLiteral, STRING_FIELD_TYPES, NUMERIC_FIELD_TYPES,
} from '../sql-helpers.js';

/**
 * Helpers shared by the `sql` emissions on the boolean function configs.
 *
 * These functions declare `accepts: []` - every type - and what they mean depends entirely on the
 * COLUMN type, so each emission branches on `inputConfig` rather than on the value. That is not a
 * shortcut: `isBoolean` on a `Boolean` column is a constant `TRUE`, and on any other column a
 * constant `FALSE`, which is the whole function.
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
 * `input.trim().toLowerCase()`, in SQL.
 *
 * Two things it has to get right, both already established: DuckDB's one-argument `trim` strips
 * ONLY spaces, so `JS_WHITESPACE` is passed explicitly, and it must run BEFORE the comparison
 * because `isTruthy`/`isFalsy` normalise the string first.
*/
function normalised(value: string): string {
    return `lower(trim(${value}, ${sqlLiteral(JS_WHITESPACE)}))`;
}

/**
 * The `_falsy` table, for a string column.
 *
 * The empty string is tested UNNORMALISED and separately, because `isFalsy` returns early on
 * `input === ''` — so `''` is falsy but `'   '` is not, even though it trims to the same thing.
*/
export function stringIsFalsy(value: string): string {
    return `(${value} = '' OR ${normalised(value)} IN ('0', 'false', 'no'))`;
}

/** The `_truthy` table, for a string column. `true` itself is a boolean and cannot appear here. */
export function stringIsTruthy(value: string): string {
    return `${normalised(value)} IN ('1', 'true', 'yes')`;
}

/**
 * Whether the column holds numbers.
 *
 * Named types only - `applies` declines anything else, so a `Date`, a `GeoPoint` or an object keeps
 * the UDF rather than being fed to a comparison that would not mean the same thing.
*/
export function isNumericColumn(inputConfig: DataTypeFieldAndChildren): boolean {
    return NUMERIC_FIELD_TYPES.includes(columnType(inputConfig));
}
