import { DuckDBType, DuckDBTypeId } from '@duckdb/node-api';
import { quoteIdentifier } from '@terascope/sql-builder';

/**
 * The column list `writeParquet` projects, so that nothing crosses the wire as a type Parquet
 * cannot carry exactly - see `int64Column`.
*/

/** DuckDB's 128-bit integers, which Parquet has no type for. */
const WIDE_INTEGER_IDS: ReadonlySet<DuckDBTypeId> = new Set([
    DuckDBTypeId.HUGEINT, DuckDBTypeId.UHUGEINT,
]);

/** True when a 128-bit integer appears anywhere in a type - a struct member or list element too. */
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
 * One column of the Parquet projection, with every 128-bit integer narrowed.
 *
 * **Parquet has no 128-bit integer, and DuckDB writes one as a DOUBLE** - silently, so every value
 * past 2^53 changes on the wire. A stored Long is already a BIGINT; this catches a COMPUTED one
 * (`n::HUGEINT + 1`, a UDF's result, `ipToInt` on IPv6).
 *
 * **It casts to the DECLARED type, built from the config** - never to DuckDB's rendered type with
 * the word replaced, which renamed a struct member called `HUGEINT` and nulled it. The cast is
 * exact for a value that fits and fails the write with DuckDB's out-of-range error for one that
 * does not; a wide column the config does not declare is refused, because there is no correct
 * type to guess. A wrong number must never reach the worker.
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
