import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, DataTypeFields, DataTypeVersion } from '@terascope/types';
import { getBuildersForConfig } from '../builder';
import { Column } from '../column';
import { ListVector, ObjectVector } from '../vector';

export function distributeRowsToColumns(
    config: DataTypeConfig, records: Record<string, unknown>[]
): Column[] {
    const len = records.length;
    const builders = getBuildersForConfig(config, len);

    for (let i = 0; i < len; i++) {
        const record: Record<string, unknown> = records[i] || {};

        for (const [field, builder] of builders) {
            builder.append(record[field] ?? null);
        }
    }

    return [...builders].map(([name, builder]) => new Column(builder.toVector(), {
        name,
        version: config.version,
        config: config.fields[name],
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
