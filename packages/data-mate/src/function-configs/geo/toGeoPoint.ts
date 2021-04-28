import { parseGeoPoint, isNil, isNumber } from '@terascope/utils';
import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export const toGeoPointConfig: FieldTransformConfig = {
    name: 'toGeoPoint',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Converts a truthy or falsy value to boolean',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;

            if (Array.isArray(input) && !_isNumberTuple(input)) {
                return input
                    .map((data: any) => {
                        if (isNil(data)) return null;
                        return parseGeoPoint(data, true);
                    });
            }

            return parseGeoPoint(input as any, true);
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Object,
        FieldType.GeoPoint,
        FieldType.Number,
        FieldType.Float
    ],

    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;
        const array = arrayType(field_config);

        return {
            field_config: {
                ...field_config,
                type: FieldType.GeoPoint,
                array
            },
        };
    }
};

function arrayType(fieldConfig: DataTypeFieldConfig): boolean {
    if (fieldConfig.type === FieldType.Number || fieldConfig.type === FieldType.Float) {
        return false;
    }

    return fieldConfig.array ?? false;
}

function _isNumberTuple(input: unknown, _parentContext?: unknown): boolean {
    if (Array.isArray(input) && input.length === 2) {
        return input.every(isNumber);
    }

    return false;
}
