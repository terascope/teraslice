import { DataTypeConfig, DataTypeFields, Maybe } from '@terascope/types';
import { mapValues } from '@terascope/utils';
import { Column } from './column';

export function distributeRowsToColumns(
    config: DataTypeConfig, records: Record<string, unknown>[]
): Column[] {
    const len = records.length;
    const values: Record<string, Maybe<unknown>[]> = mapValues(config.fields, () => []);
    const fieldEntries = Object.entries(config.fields);

    for (let i = 0; i < len; i++) {
        const record: Record<string, unknown> = records[i] || {};

        if (isEmptyObj(record, config.fields)) continue;

        for (const [field] of fieldEntries) {
            values[field].push(record[field] ?? null);
        }
    }

    return fieldEntries.map(([name, fieldConfig]) => new Column({
        name,
        config: fieldConfig,
        values: values[name].slice()
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
