import {
    DataTypeConfig, DataTypeFieldConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { DataType } from '@terascope/data-types';
import { quoteIdentifier } from '@terascope/sql-builder';
import { getChildDataTypeConfig } from '../core/utils.js';
import { coerceToType } from '../builder/type-coercion.js';
import { makeValueConverter } from './duck-values.js';
import { DuckContext } from './DuckContext.js';
import { CreatedTable, FieldPlan, FrameConfig } from './interfaces.js';

/**
 * Creating the table a frame's rows live in, and resolving how each field gets into it.
*/

let tableCounter = 0;

/** Table names come from us, never from user data, so a counter suffices. */
export function nextTableName(name?: string): string {
    tableCounter += 1;
    const base = (name ?? 'duck_frame').replace(/[^A-Za-z0-9_]/g, '_');
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
                coerce: coerceToType(fieldConfig as DataTypeFieldConfig, children),
                convert: makeValueConverter(fieldConfig as DataTypeFieldConfig, children),
            };
        });
}

/**
 * Creates the table for a config, and reports the column set it declared.
 *
 * Shared by `fromRecords` (which then appends records) and `empty` (which is then filled by
 * `appendParquet`), so one DDL path serves both ingest tiers.
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
