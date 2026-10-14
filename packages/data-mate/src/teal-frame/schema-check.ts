import { DataTypeFieldConfig, DataTypeConfig, FieldType } from '@terascope/types';
import { TealFrame } from './TealFrame.js';
import { DataType } from '@terascope/data-types';

/**
 * One disagreement between a frame's declared `DataTypeConfig` and the column types DuckDB
 * actually produces.
 */
export interface SchemaMismatch {
    column: string;
    /**
     * The `FieldType` the config declares. Reports lead with this, because DuckDB types are a
     * storage detail. Absent when `kind` is `unexpected` (the column was never declared).
    */
    declared?: FieldType;
    kind: 'type' | 'missing' | 'unexpected';
    /**
     * For diagnosis: the DuckDB type `declared` maps to, and the type DuckDB actually produced.
     *
     * There is no DuckDB-to-`FieldType` mapping, because it would be ambiguous (`VARCHAR` backs
     * `Keyword`, `Text`, `IP`, `Binary` and more). So types are compared as DuckDB types.
    */
    storage?: { declared?: string; actual?: string };
}

/**
 * Returns the DuckDB column type of each column in a frame, for diagnosis and for checking a
 * config against what DuckDB produced.
*/
export async function describeColumns(frame: TealFrame): Promise<Record<string, string>> {
    const rows = await frame.rawRows(`DESCRIBE SELECT * FROM ${frame.from}`);
    return Object.fromEntries(
        rows.map((row) => [String(row[0]), String(row[1])])
    );
}

/**
 * Compares a frame's declared config with the column types DuckDB actually produced. An empty
 * array means they agree.
 *
 * A column's type comes from its SQL expression, not from the config, so a projection can
 * declare `Integer` while its SQL yields VARCHAR. Aggregations are a common case: DuckDB
 * promotes `sum(BIGINT)` to HUGEINT, while data-mate treats the result as a `Long`.
 *
 * Returns the differences rather than throwing, so a caller can assert on them, log them, or
 * ignore kinds it does not care about.
 */
export async function diffSchema(frame: TealFrame): Promise<SchemaMismatch[]> {
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
 * Normalizes a DuckDB type string for comparison.
 *
 * `toDuckDB()` and `DESCRIBE` use the same canonical spellings, so only case, whitespace and
 * quotes need normalizing. If a spelling-only mismatch appears, add an alias here.
 *
 * Quotes are removed because `toDuckDB()` always quotes STRUCT member names (names such as
 * `order` are reserved words), while `DESCRIBE` reports them unquoted.
 */
function normalize(type: string): string {
    return type.trim().toUpperCase()
        .replace(/"/g, '')
        // a GEOMETRY read from GeoParquet carries its CRS, as in `GEOMETRY('OGC:CRS84')`;
        // that is metadata, not a different type
        .replace(/GEOMETRY\('[^']*'\)/g, 'GEOMETRY');
}
