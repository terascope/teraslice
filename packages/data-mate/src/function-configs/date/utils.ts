import { DateFormat, FieldType, TimeResolution } from '@terascope/types';
import { numericTypes, stringTypes } from '../../core';
import { DataTypeFieldAndChildren } from '../interfaces';

export function getInputFormat(
    inputConfig: DataTypeFieldAndChildren|undefined
): string|DateFormat|undefined {
    const inputResolution = (inputConfig?.field_config.resolution as TimeResolution|undefined);

    let inputFormat: DateFormat|string|undefined = inputConfig?.field_config.format;
    if (!inputFormat) {
        const type = (inputConfig?.field_config?.type as FieldType|undefined) || FieldType.Any;
        if (type === FieldType.Date || stringTypes.has(type)) {
            inputFormat = DateFormat.iso_8601;
        } else if (numericTypes.has(type)) {
            inputFormat = inputResolution === TimeResolution.SECONDS
                ? DateFormat.epoch : DateFormat.epoch_millis;
        }
    }
    return inputFormat!;
}

export function isIS8601FieldConfig(inputConfig: DataTypeFieldAndChildren|undefined): boolean {
    if (inputConfig?.field_config?.type !== FieldType.Date) return false;
    if (inputConfig.field_config.format === DateFormat.iso_8601) return true;
    if (inputConfig.field_config.format == null) return true;
    return false;
}
