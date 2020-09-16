import { getGroupedFields, LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, DataTypeFields, DataTypeVersion } from '@terascope/types';
import { Builder } from '../builder';
import { Column } from '../column';
import { ObjectVector } from '../vector';
import { ListVector } from '../vector/list-vector';

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
        builders[field] = Builder.make(config.fields[field], childConfig);
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
    const versions = new Set<DataTypeVersion>();
    const fields: DataTypeFields = {};
    for (const col of columns) {
        versions.add(col.version);
        fields[col.name] = col.config;
        // make sure we populate the nested fields
        if (col.vector instanceof ObjectVector || col.vector instanceof ListVector) {
            if (col.vector.childConfig) {
                for (const nestedField of Object.keys(col.vector.childConfig)) {
                    fields[`${col.name}.${nestedField}`] = col.vector.childConfig[nestedField];
                }
            }
        }
    }
    return {
        version: versions.size ? (Math.max(...versions) as DataTypeVersion) : LATEST_VERSION,
        fields,
    };
}
