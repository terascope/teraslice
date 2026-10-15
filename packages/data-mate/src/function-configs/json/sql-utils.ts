import { FieldType } from '@terascope/types';

/**
 * Helpers shared by the SQL expressions on the json function configs.
*/

/**
 * The column types where `to_json` produces exactly what `JSON.stringify` produces.
 *
 * The other types are left out on purpose:
 *
 * - Floating point: `to_json(2.0)` is `'2.0'` where `JSON.stringify(2)` is `'2'`, and `to_json`
 *   writes `1e21` where JavaScript writes `1e+21`.
 * - Date: a TIMESTAMP renders as `"2026-01-02 03:04:05.678"`, without the `T` or the `Z`.
 * - Integer and Long: not yet compared against the JavaScript. `to_json` renders them, and the
 *   UDF path handles them (see `udf-types-spec`), so they are candidates to add.
 * - Any/JSON, GeoJSON, GeoPoint, Object and Tuple: not yet compared against the JavaScript.
 *   `to_json` on a STRUCT matches `JSON.stringify`, including key order, so these are candidates to
 *   add.
*/
export const JSON_SQL_TYPES: readonly FieldType[] = [
    FieldType.String,
    FieldType.Keyword,
    FieldType.Text,
    FieldType.NgramTokens,
    FieldType.Boolean,
];
