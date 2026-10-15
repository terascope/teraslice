import { DuckDBType, DuckDBTypeId } from '@duckdb/node-api';
import { quoteIdentifier } from '@terascope/sql-builder';

/**
 * Builds the column list `writeParquet` selects, so every column is written as a type Parquet
 * can hold exactly. See `int64Column`.
*/

/** DuckDB's 128-bit integers, which Parquet has no type for. */
const WIDE_INTEGER_IDS: ReadonlySet<DuckDBTypeId> = new Set([
    DuckDBTypeId.HUGEINT, DuckDBTypeId.UHUGEINT,
]);

/** True when a 128-bit integer appears anywhere in a type, including nested members. */
function hasWideInteger(type: DuckDBType): boolean {
    if (WIDE_INTEGER_IDS.has(type.typeId)) return true;
    const nested = type as {
        entryTypes?: readonly DuckDBType[];
        memberTypes?: readonly DuckDBType[];
        valueType?: DuckDBType;
        keyType?: DuckDBType;
    };
    return [
        ...(nested.entryTypes ?? []),
        ...(nested.memberTypes ?? []),
        ...(nested.valueType ? [nested.valueType] : []),
        ...(nested.keyType ? [nested.keyType] : []),
    ].some(hasWideInteger);
}

/**
 * Returns one column of the Parquet projection, with any 128-bit integer narrowed.
 *
 * **Parquet has no 128-bit integer, and DuckDB silently writes one as a DOUBLE**, which changes
 * every value past 2^53. A stored Long is already a BIGINT; this handles computed values
 * (`n::HUGEINT + 1`, a UDF result, `ipToInt` on IPv6).
 *
 * The column is cast to the type declared in the config. Editing DuckDB's rendered type string
 * instead would also rewrite a struct member named `HUGEINT`. The cast is exact for values that
 * fit and fails the write with DuckDB's out-of-range error for values that do not. A wide column
 * the config does not declare is rejected, because there is no correct type to choose.
*/
export function int64Column(name: string, type: DuckDBType, declared: string | undefined): string {
    const column = quoteIdentifier(name);
    if (!hasWideInteger(type)) return column;
    if (declared == null) {
        throw new TypeError(
            `Cannot write column "${name}" to Parquet: it holds a 128-bit integer (${type}), which`
            + ' Parquet cannot carry, and the frame config does not declare it'
        );
    }
    return `CAST(${column} AS ${declared}) AS ${column}`;
}
