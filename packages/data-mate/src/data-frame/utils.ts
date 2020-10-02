import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    DataTypeFields, DataTypeVersion
} from '@terascope/types';
import { Builder, getBuildersForConfig } from '../builder';
import { Column } from '../column';
import { ListVector, ObjectVector } from '../vector';

export function buildRecords<T extends Record<string, any>>(
    builders: Map<keyof T, Builder<unknown>>,
    records: T[],
): [keyof T, Builder<any>][] {
    const len = records.length;

    for (let i = 0; i < len; i++) {
        for (const [field, builder] of builders) {
            builder.append(records[i][field]);
        }
    }
    return [...builders];
}

export function distributeRowsToColumns<T extends Record<string, any>>(
    config: DataTypeConfig|ReadonlyDataTypeConfig, records: T[]
): Column<any, keyof T>[] {
    return buildRecords(
        getBuildersForConfig<T>(config, records.length),
        records
    ).map(([name, builder]) => (
        new Column(builder.toVector(), {
            name,
            version: config.version
        })
    ));
}

export function concatColumnsToColumns<T extends Record<string, any>>(
    builders: Map<keyof T, Builder<any>>,
    columns: readonly Column<any, keyof T>[],
    offset: number
): [keyof T, Builder<any>][] {
    for (const [field, builder] of builders) {
        const col = columns.find(((c) => c.name === field));
        if (col) {
            for (const [value, indices] of col.vector.data.associations()) {
                builder.mset(
                    indices.map((i) => offset + i),
                    value,
                );
            }

            builder.data.nulls = builder.size - col.size;
        } else {
            builder.data.nulls = builder.size;
        }
    }
    return [...builders];
}

export function columnsToDataTypeConfig<T extends Record<string, unknown>>(
    columns: readonly Column<unknown, keyof T>[]
): DataTypeConfig {
    const versions = new Set<DataTypeVersion>();
    const fields: DataTypeFields = {};
    for (const col of columns) {
        versions.add(col.version);
        fields[String(col.name)] = col.config;
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
