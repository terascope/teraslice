import { DuckDBTimestampValue } from '@duckdb/node-api';
import { toISO8601 } from '@terascope/core-utils';

/**
 * Turns a value read out of DuckDB into the plain JS shape the response path expects.
 *
 * `rows()` is the OUTPUT path - the QPL engine hands these records straight to the response -
 * so anything DuckDB-shaped leaking through would reach users. Found by the FieldType sweep in
 * `type-sweep-spec.ts`; nothing had covered arrays, structs or dates through `rows()` before,
 * because the older specs read them via `query()` with explicit casts, which bypasses all of
 * this. Three separate leaks:
 *
 * - **LIST** -> `DuckDBListValue`, not an array. Would serialize as `{"items":[...]}`.
 * - **TIMESTAMP** -> `DuckDBTimestampValue`, not a date. Rendered via `toISO8601`, which is
 *   what `DateVector.toJSONCompatibleValue` uses, so the two frames agree.
 * - **BIGINT / HUGEINT** -> a JS `bigint`, and **`JSON.stringify` THROWS on bigint**
 *   ("Do not know how to serialize a BigInt"), so every Integer or Long column broke the
 *   response. Converted by `bigIntToPlain` below, giving a number when it fits exactly and an
 *   exact decimal string once it does not.
 *
 * **BIGINT is converted HERE, not by `core-utils`' `bigIntToJSON`** - see DEF-BIGINT,
 * tracked as terascope/teraslice#4555.
 * That helper is broken in two ways, and neither is safe on this path:
 *
 * - it subtracts 1 from every positive value above the safe limit, to cancel a matching `+1`
 *   in `toBigInt`. A value read out of DuckDB never went through `toBigInt`, so it takes the
 *   `-1` alone and comes back one too low.
 * - its bound is a SIGNED comparison, so every negative falls into the lossy branch with no
 *   string fallback: `-9223372036854775808` comes back as `-9223372036854776000`.
 *
 * The rule below is `export-json.ts`' rule - `abs(value) > MAX_SAFE` becomes an exact decimal
 * string, anything smaller becomes a number - so **`rows()` and `ndjson()` agree by
 * construction**, which is the invariant `duck-frame-spec.ts` pins. The wider fix belongs in
 * `core-utils` and is tracked separately; this path does not wait for it.
*/
export /** The largest whole number JSON can carry without `JSON.parse` rounding it. */
const MAX_SAFE_BIGINT = 9007199254740991n;

/**
 * A bigint as the plain JSON value it should be: a number while it fits exactly, an exact
 * decimal string once it does not.
 *
 * The bound is on the MAGNITUDE, so it is symmetric - the same rule `export-json.ts` emits as
 * `abs(x) > 9007199254740991`. No arithmetic is applied to the value; `toString(10)` on a
 * bigint is exact at any size, which is the whole reason the type exists.
*/
function bigIntToPlain(value: bigint): number | string {
    if (value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT) return value.toString(10);
    return Number(value);
}

export function toPlainValue(value: unknown): unknown {
    if (value == null) return value;

    if (typeof value === 'bigint') return bigIntToPlain(value);

    if (typeof value !== 'object') return value;

    if (value instanceof DuckDBTimestampValue) {
        return toISO8601(Number(value.micros / 1000n));
    }

    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items.map(toPlainValue);

    const entries = (value as { entries?: unknown }).entries;
    if (entries != null && typeof entries === 'object') {
        return Object.fromEntries(
            Object.entries(entries as Record<string, unknown>)
                .map(([key, val]) => [key, toPlainValue(val)])
        );
    }

    return value;
}
