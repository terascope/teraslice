import { FieldType } from '@terascope/types';

/**
 * Helpers shared by the `sql` emissions on the json function configs.
*/

/**
 * The column types where `to_json` renders exactly what `JSON.stringify` renders.
 *
 * Measured, not assumed (`docs/tools/probe/remaining-26.mjs`). What is absent is as deliberate as
 * what is present:
 *
 * - **no floating point.** `to_json(2.0)` is `'2.0'` and `JSON.stringify(2)` is `'2'`; `to_json`
 *   writes `1e21` where JavaScript writes `1e+21`. Reproducing JavaScript's number-to-string
 *   algorithm in SQL is a different project from calling `to_json`.
 * - **no Date.** A TIMESTAMP renders as `"2026-01-02 03:04:05.678"`, without the `T` or the `Z`.
 * - **no integers**, and this one is not about `to_json` at all - see known-defects DF11. The gate
 *   found that `toJSON`'s own UDF FAILS on an `Integer` or `Long` column with
 *   `Invalid Input Error: A string was expected`, because `bigIntToJSON` returns a NUMBER for
 *   anything up to `Number.MAX_SAFE_INTEGER` while `output_type` promises a String. `to_json` gets
 *   these right; the emission is withheld because there is no working UDF to prove it against, and
 *   silently changing a column from a broken query into a working one belongs in a decision, not
 *   in a guard.
 * - **no `Any`/JSON, GeoJSON, GeoPoint, Object or Tuple.** Those have no UDF path either
 *   (known-defects DF7) - and `to_json` on a STRUCT was measured equal to `JSON.stringify`, key
 *   order included, so they are worth revisiting the moment the gate can compare them against the
 *   JavaScript directly.
*/
export const JSON_SQL_TYPES: readonly FieldType[] = [
    FieldType.String,
    FieldType.Keyword,
    FieldType.Text,
    FieldType.NgramTokens,
    FieldType.Boolean,
];
