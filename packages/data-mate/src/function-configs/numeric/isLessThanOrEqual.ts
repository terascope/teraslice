import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface LessThanOrEqualToArgs {
    readonly value: number;
}

export const isLessThanOrEqualToConfig: FieldValidateConfig<LessThanOrEqualToArgs> = {
    name: 'isLessThanOrEqualTo',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Check if a number is less than or equal to the specified value',
    examples: [
        {
            args: { value: 100 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 110,
            output: null
        },
        {
            args: { value: 50 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 50,
            output: 50
        },
        {
            args: { value: 110 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 100,
            output: 100
        },
        {
            args: { value: 150 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 149,
            output: 149
        }
    ],
    create({ args: { value } }) {
        return isLessThan(value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
        }
    },
    required_arguments: ['value']
};

function isLessThan(value: number) {
    return function _isLessThan(input: unknown): boolean {
        return (input as number) <= value;
    };
}