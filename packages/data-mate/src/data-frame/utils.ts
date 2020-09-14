import { getGroupedFields, LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, DataTypeFields, DataTypeVersion } from '@terascope/types';
import { Builder, newBuilder } from '../builder';
import { Column } from '../column';

export function distributeRowsToColumns(
    config: DataTypeConfig, records: Record<string, unknown>[]
): Column[] {
    const len = records.length;
    const builders: Record<string, Builder<unknown>> = {};
    const groupedFieldEntries = Object.entries(getGroupedFields(config.fields));
    for (const [field, nested] of groupedFieldEntries) {
        const childConfig: DataTypeFields = {};
        nested.forEach((fullField) => {
            if (fullField === field) return;
            const nestedField = fullField.replace(`${field}.`, '');
            childConfig[nestedField] = config.fields[fullField];
        });
        builders[field] = newBuilder(config.fields[field], childConfig);
    }

    for (let i = 0; i < len; i++) {
        const record: Record<string, unknown> = records[i] || {};

        for (const [field] of groupedFieldEntries) {
            builders[field].append(record[field] ?? null);
        }
    }

    return groupedFieldEntries.map(([name]) => new Column({
        name,
        version: config.version,
        config: config.fields[name],
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
