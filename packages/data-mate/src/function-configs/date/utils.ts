import { DateFormat, FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../interfaces';

export function isIS8601FieldConfig(inputConfig: DataTypeFieldAndChildren|undefined): boolean {
    if (inputConfig?.field_config?.type !== FieldType.Date) return false;
    if (inputConfig.field_config.format === DateFormat.iso_8601) return true;
    if (inputConfig.field_config.format == null) return true;
    return false;
}
