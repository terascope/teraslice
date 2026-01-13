import { isBigInt, isNumber, toFloatOrThrow } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, FunctionDefinitionType,
    ProcessMode, DataTypeFieldAndChildren, FunctionDefinitionCategory
} from '../interfaces.js';

function multiplyValuesReducer(
    acc: number | null,
    curr: (number | bigint | null)[]|(number | bigint | null)
): number | null {
    const currValue = (Array.isArray(curr) ? multiplyValuesFn(curr) : curr);
    if (currValue == null) return acc;
    if (acc == null) return toFloatOrThrow(currValue);
    return acc * toFloatOrThrow(currValue);
}

function multiplyValuesFn(value: unknown): bigint | number | null {
    if (isNumber(value) || isBigInt(value)) return value;
    if (!Array.isArray(value)) return null;

    return value.reduce(multiplyValuesReducer, null);
}

export const multiplyValuesConfig: FieldTransformConfig = {
    name: 'multiplyValues',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Multiplies the values with a given field, this requires an array to function correctly',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [100, 10],
            output: 1000
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
                    'testField.2': { type: FieldType.Long },
                }
            },
            field: 'testField',
            input: [10, 100000, 2],
            output: 2000000
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: { type: FieldType.Tuple },
                    'testField.0': { type: FieldType.Byte, array: true },
                    'testField.1': { type: FieldType.Integer },
                    'testField.2': { type: FieldType.Long, array: true },
                    'testField.3': { type: FieldType.Short }
                }
            },
            field: 'testField',
            input: [[10, null], 100000, [2], null],
            output: 2000000
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: { type: FieldType.Byte },
                }
            },
            field: 'testField',
            input: 2,
            output: 2
        }
    ],
    create() {
        return multiplyValuesFn;
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
