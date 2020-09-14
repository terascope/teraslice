import { v4 as uuid } from 'uuid';
import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, DataTypeFields, DataTypeVersion } from '@terascope/types';
import { mapValues } from '@terascope/utils';
import { Builder, newBuilder } from '../builder';
import { Column } from '../column';

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

export function columnsToDataTypeConfig(
    columns: readonly Column<unknown>[]
): DataTypeConfig {
    let version: DataTypeVersion|undefined;
    const fields: DataTypeFields = {};
    for (const col of columns) {
        // FIXME maybe we should pick the latest
        if (version && col.version !== version) {
            throw new Error(
                `Data Type version mismatch ${col.version} on column ${col.name}, expected ${version}`
            );
        }
        fields[col.name] = col.config;
    }
    return {
        version: version ?? LATEST_VERSION,
        fields,
    };
}

const _columnIds = new WeakMap<Column<any>[], string>();
export function getColumnsId(columns: Column<any>[]): string {
    const id = _columnIds.get(columns);
    if (id) return id;
    const newId = uuid();
    _columnIds.set(columns, newId);
    return newId;
}
