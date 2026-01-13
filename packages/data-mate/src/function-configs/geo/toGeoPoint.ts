import { isNil, isNumber } from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
    isNumericType
} from '../interfaces.js';

export const toGeoPointConfig: FieldTransformConfig = {
    name: 'toGeoPoint',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '60,40',
            output: { lon: 40, lat: 60 }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Object } } },
            field: 'testField',
            input: { latitude: 40, longitude: 60 },
            output: { lon: 60, lat: 40 }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Number, array: true } } },
            field: 'testField',
            input: [50, 60],
            output: { lon: 50, lat: 60 }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'not an geo point',
            output: null,
            fails: true
        },
    ],
    description: 'Converts the input to a geo-point',
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
        FieldType.Geo,
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
    if (isNumericType(fieldConfig)) {
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
