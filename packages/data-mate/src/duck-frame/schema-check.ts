import { DataTypeFieldConfig, DataTypeConfig, FieldType } from '@terascope/types';
import { DuckFrame } from './DuckFrame.js';
import { DataType } from '@terascope/data-types';

/**
 * One disagreement between a frame's declared `DataTypeConfig` and the column types DuckDB
 * actually produces.
 */
export interface SchemaMismatch {
    column: string;
    /**
     * The `FieldType` the config declares. **This is the primary fact** - `FieldType` is the
     * system's field-type language and DuckDB types are an implementation detail of storage.
     * Absent when `unexpected` (the column was produced but never declared).
    */
    declared?: FieldType;
    kind: 'type' | 'missing' | 'unexpected';
    /**
     * Supporting detail, for diagnosis only: the DuckDB type `declared` implies and the one
     * DuckDB actually produced.
     *
     * There is deliberately **no reverse DuckDB -> FieldType mapping** here. It would be
     * lossy and would invent facts: `VARCHAR` is `Keyword`, `Text`, `IP`, `Binary` and six
     * more, so "actual FieldType" is not knowable from a column type. Comparison happens in
     * DuckDB terms because that is where the truth is; reporting leads with `FieldType`.
    */
    storage?: { declared?: string; actual?: string };
}

/**
 * The DuckDB column types a frame's rows actually have.
 *
 * Storage-level detail, for diagnosis. `FieldType` is the field-type language everywhere
 * else; this exists because a config can only be checked against what DuckDB really made.
*/
export async function describeColumns(frame: DuckFrame): Promise<Record<string, string>> {
    const rows = await frame.query(`DESCRIBE SELECT * FROM ${frame.from}`);
    return Object.fromEntries(
        rows.map((row) => [String(row[0]), String(row[1])])
    );
}

/**
 * Declared config versus what DuckDB actually produced. An empty array means they agree.
 *
 * **Why this exists.** The config is the plan's running statement of what each field is, but a
 * relation's column type comes from its *expression*, not from the config - so a projection can
 * declare `Integer` while its SQL yields VARCHAR, and nothing notices until something
 * downstream breaks. This is the only cheap way to catch a config that lies.
 *
 * It catches the aggregation case in particular: DuckDB promotes `sum(BIGINT)` to HUGEINT,
 * where data-mate's rules say the result is a `Long`. Without an explicit CAST the declared
 * and actual types drift apart silently.
 *
 * Returns the diff rather than throwing, so a caller can assert on it, log it, or ignore the
 * kinds it does not care about.
 */
export async function diffSchema(frame: DuckFrame): Promise<SchemaMismatch[]> {
    const declared = new DataType(frame.config as DataTypeConfig).toDuckDB();
    const actual = await describeColumns(frame);
    const mismatches: SchemaMismatch[] = [];

    const fields = frame.config.fields ?? {};

    for (const [column, declaredType] of Object.entries(declared)) {
        const actualType = actual[column];
        const fieldType = (fields[column] as DataTypeFieldConfig | undefined)?.type as FieldType;

        if (actualType == null) {
            mismatches.push({
                column, declared: fieldType, kind: 'missing', storage: { declared: declaredType }
            });
        } else if (normalize(declaredType) !== normalize(actualType)) {
            mismatches.push({
                column,
                declared: fieldType,
                kind: 'type',
                storage: { declared: declaredType, actual: actualType },
            });
        }
    }

    for (const [column, actualType] of Object.entries(actual)) {
        if (!(column in declared)) {
            mismatches.push({ column, kind: 'unexpected', storage: { actual: actualType } });
        }
    }

    return mismatches;
}

/**
 * `toDuckDB()` already emits DuckDB's canonical spellings, and `DESCRIBE` renders them
 * the same way (verified for STRUCT and array types), so case and padding is all that needs
 * normalising. If a real mismatch ever turns out to be spelling-only, add that alias here
 * rather than reaching for a general type-string parser.
 */
function normalize(type: string): string {
    return type.trim().toUpperCase();
}
