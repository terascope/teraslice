/**
 * Build a `DataTypeConfig` from a Parquet corpus.
 *
 * **Why this is needed.** `DuckFrame.fromParquet(config, path)` takes the
 * DataTypeConfig FIRST — the frame is told what the data IS, it does not infer
 * it. That is the right design for the real flow, where `qpl-worker` already
 * knows the config from the search query. But this harness is pointed at
 * objects it has never seen, so it has to reconstruct one.
 *
 * **This mapping is APPROXIMATE and exists only to exercise the frame.** It
 * inverts `DataType.toDuckDB()`, which is not injective — three FieldTypes map
 * to VARCHAR and three to DOUBLE — so the reconstruction picks the widest safe
 * option and cannot recover the original intent:
 *
 *     Keyword | Text | String | IP | IPRange   -> VARCHAR
 *     Float | Double | Number                  -> DOUBLE
 *     Integer -> BIGINT,  Long -> HUGEINT
 *
 * An IP column therefore comes back as `Keyword`, not `IP`. That is harmless
 * for timing query shapes, and would be wrong for anything asserting semantics.
 * Do not lift this into production code.
 */

/** DuckDB type (as `DESCRIBE` reports it) -> data-mate FieldType. */
function fieldTypeFor(duckType) {
    const type = String(duckType).toUpperCase();

    if (type.startsWith('BOOLEAN')) return 'Boolean';
    if (type.startsWith('TINYINT')) return 'Byte';
    if (type.startsWith('SMALLINT')) return 'Short';
    if (type.startsWith('HUGEINT')) return 'Long';
    if (/^(BIGINT|INTEGER|INT|UINTEGER|UBIGINT|USMALLINT|UTINYINT)/.test(type)) return 'Integer';
    if (/^(DOUBLE|FLOAT|REAL|DECIMAL)/.test(type)) return 'Double';
    if (/^(TIMESTAMP|DATE|TIME)/.test(type)) return 'Date';
    if (type.startsWith('JSON')) return 'Any';
    if (/^(VARCHAR|CHAR|STRING|TEXT|UUID|BLOB)/.test(type)) return 'Keyword';

    // STRUCT, LIST, MAP and anything else. `Any` maps to JSON, which is the
    // only FieldType that can hold an arbitrary shape.
    return 'Any';
}

/**
 * @param {Array<[string, string]>} described rows from `DESCRIBE SELECT * FROM ...`
 * @returns {{ config: object, skipped: Array<{name: string, type: string}> }}
 */
export function configFromSchema(described) {
    const fields = {};
    const mapped = [];
    const skipped = [];

    for (const [name, duckType] of described) {
        // A dotted name would be regrouped into a STRUCT by GroupType.toDuckDB()
        // and stop matching the Parquet column, so those are left out rather
        // than silently reshaped.
        if (String(name).includes('.')) {
            skipped.push({ name, type: duckType, reason: 'dotted name would regroup into a STRUCT' });
            continue;
        }
        const fieldType = fieldTypeFor(duckType);
        fields[name] = { type: fieldType };
        mapped.push({ name, duckType, fieldType });
    }

    return { config: { version: 1, fields }, mapped, skipped };
}
