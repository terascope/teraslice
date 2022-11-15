import { DataTypeConfig, DataTypeFields, FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../function-configs/interfaces.js';
import { getChildDataTypeConfig } from '../core/index.js';

export function getDataTypeFieldAndChildren(
    config: DataTypeConfig|undefined, field: string|undefined
): DataTypeFieldAndChildren|undefined {
    if (!field || !config) return;
    const fieldConfig = config.fields[field];
    if (!fieldConfig) return;
    const childConfig: DataTypeFields|undefined = getChildDataTypeConfig(
        config.fields, field, fieldConfig.type as FieldType
    );
    return { field_config: fieldConfig, child_config: childConfig };
}
