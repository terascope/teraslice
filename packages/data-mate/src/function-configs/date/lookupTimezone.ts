import { isNil, isNumber, lookupTimezone } from '@terascope/core-utils';
import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    DataTypeFieldAndChildren, FunctionDefinitionCategory,
    isNumericType
} from '../interfaces.js';

export const lookupTimezoneConfig: FieldTransformConfig = {
    name: 'lookupTimezone',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '33.385765, -111.891167',
            output: 'America/Phoenix'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '30.00123,-12.233',
            output: 'Etc/GMT+1',
            description: 'in ocean outside Morocco'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Number, array: true } } },
            field: 'testField',
            input: [30.00123, 12.233],
            output: 'Africa/Khartoum'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Object } } },
            field: 'testField',
            input: { lat: 48.86168702148502, lon: 2.3366209636711 },
            output: 'Europe/Paris',
        },
    ],
    description: 'Returns the timezone of a geo point\'s location.',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;

            if (Array.isArray(input) && !_isNumberTuple(input)) {
                return input
                    .map((data: any) => {
                        if (isNil(data)) return null;
                        return lookupTimezone(data);
                    });
            }

            return lookupTimezone(input);
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
                type: FieldType.String,
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
