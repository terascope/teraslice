import {
    DataTypeConfig, DataTypeFieldConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { DataType } from '@terascope/data-types';
import { quoteIdentifier } from '@terascope/sql-builder';
import { getChildDataTypeConfig } from '../core/utils.js';
import { coerceToType } from '../builder/type-coercion.js';
import { makeValueConverter, makeBigIntInputNormalizer } from './duck-values.js';
import { DuckContext } from './DuckContext.js';
import { CreatedTable, FieldPlan, FrameConfig } from './interfaces.js';

/**
 * Creates the table that holds a frame's rows, and plans how each field is coerced into it.
*/

let tableCounter = 0;

/** Returns a unique table name. Names never come from user data, so a counter is enough. */
export function nextTableName(name?: string): string {
    tableCounter += 1;
    const base = (name ?? 'teal_frame').replace(/[^A-Za-z0-9_]/g, '_');
    return `${base}_${tableCounter}`;
}

/**
 * Resolves each top-level field to its coercion and its DuckDB value conversion.
 *
 * Dot-notation children are folded into their parent, so the plan matches the table's
 * real column set.
*/
export function buildPlan(config: FrameConfig): FieldPlan[] {
    const fields = config.fields ?? {};
    return Object.entries(fields)
        .filter(([name]) => !name.includes('.'))
        .map(([name, fieldConfig]) => {
            const children = getChildDataTypeConfig(
                fields, name, fieldConfig.type as FieldType
            ) as DataTypeFields | undefined;
            return {
                name,
                fieldType: String(fieldConfig.type),
                coerce: exactCoerce(fieldConfig as DataTypeFieldConfig, children),
                convert: makeValueConverter(fieldConfig as DataTypeFieldConfig, children),
            };
        });
}

/**
 * Returns `coerceToType` for a field, with large bigint inputs first rewritten as strings so
 * they are coerced exactly. See `makeBigIntInputNormalizer`.
*/
function exactCoerce(
    fieldConfig: DataTypeFieldConfig,
    children?: DataTypeFields
): (value: unknown) => unknown {
    const coerce = coerceToType(fieldConfig, children);
    const normalize = makeBigIntInputNormalizer(fieldConfig, children);
    return normalize ? (value) => coerce(normalize(value)) : coerce;
}

/**
 * Creates the table for a config and returns its name and columns.
 *
 * Used by both `fromRecords` (which then appends records) and `empty` (which is then filled by
 * `appendParquet`).
*/
export async function createTable(
    context: DuckContext,
    config: FrameConfig,
    name?: string
): Promise<CreatedTable> {
    const plan = buildPlan(config);
    if (plan.length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }

    const table = nextTableName(name);
    const columnTypes = new DataType(config as DataTypeConfig).toDuckDB();
    const ddl = plan
        .map(({ name: column }) => `${quoteIdentifier(column)} ${columnTypes[column]}`)
        .join(', ');

    await context.run(`CREATE OR REPLACE TABLE ${quoteIdentifier(table)} (${ddl})`);

    return { table, columns: plan.map(({ name: column }) => column) };
}
