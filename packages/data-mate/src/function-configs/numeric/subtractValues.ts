import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, FunctionDefinitionType,
    ProcessMode, DataTypeFieldAndChildren, FunctionDefinitionCategory
} from '../interfaces';

function subtractValuesReducer(
    acc: number,
    curr: number|bigint
): number {
    if (acc == null) return toFloatOrThrow(curr);
    return acc - toFloatOrThrow(curr);
}

function subtractValuesFn(value: unknown): bigint|number|null {
    if (!Array.isArray(value)) return null;

    return value.reduce(subtractValuesReducer) ?? null;
}

export const subtractValuesConfig: FieldTransformConfig = {
    name: 'subtractValues',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'subtract the values with a given field, this requires an array to function correctly',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [100, 10],
            output: 90
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [10],
            output: 10
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: { type: FieldType.Tuple },
                    'testField.0': { type: FieldType.Byte, array: true },
                    'testField.1': { type: FieldType.Integer },
                    'testField.2': { type: FieldType.Long }
                }
            },
            field: 'testField',
            input: [10, 100000, 2],
            output: -99992
        }
    ],
    create() {
        return subtractValuesFn;
    },
    argument_schema: {},
    accepts: [FieldType.Number],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                array: false,
                type: FieldType.Number
            },
            child_config: undefined
        };
    }
};
