import { DataTypeConfig, DataTypeFields } from '@terascope/types';
import { mapValues } from '@terascope/utils';
import { Builder, newBuilder } from '../builder';
import { Column } from './column';

export function distributeRowsToColumns(
    config: DataTypeConfig, records: Record<string, unknown>[]
): Column[] {
    const len = records.length;
    const builders: Record<string, Builder<unknown>> = mapValues(
        config.fields,
        (fieldConfig) => newBuilder(fieldConfig)
    );
    const fieldEntries = Object.entries(config.fields);

    for (let i = 0; i < len; i++) {
        const record: Record<string, unknown> = records[i] || {};

        if (isEmptyObj(record, config.fields)) continue;

        for (const [field] of fieldEntries) {
            builders[field].append(record[field] ?? null);
        }
    }

    return fieldEntries.map(([name, fieldConfig]) => new Column({
        name,
        version: config.version,
        config: fieldConfig,
        vector: builders[name].toVector()
    }));
}

function isEmptyObj(obj: Record<string, unknown>, fieldConfig: DataTypeFields): boolean {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)
            && key in fieldConfig
            && obj[key] != null) {
            return false;
        }
    }
    return true;
}
