import { DataTypeConfig, Maybe } from '@terascope/types';
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
        for (const [field] of fieldEntries) {
            values[field].push(record[field] ?? null);
        }
    }

    return fieldEntries.map(([name, fieldConfig]) => new Column(
        name, fieldConfig, values[name].slice()
    ));
}
