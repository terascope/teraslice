import { parseGeoPoint, isNil, isNumber } from '@terascope/utils';
import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export const isGeoPointConfig: FieldTransformConfig = {
    name: 'isGeoPoint',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Checks if value is parsable to geo-point',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;

            if (Array.isArray(input) && !_isNumberTuple(input)) {
                // TODO: this needs changes
                return input
                    .map((data: any) => {
                        if (isNil(data)) return null;
                        return parseGeoPoint(data, true);
                    });
            }

            const results = parseGeoPoint(input as any, false);
            return results != null;
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
