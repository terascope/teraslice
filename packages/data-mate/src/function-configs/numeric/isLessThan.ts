import { FieldType } from '@terascope/types';
import { isLessThanFP } from '@terascope/core-utils';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface LessThanArgs {
    readonly value: number;
}

export const isLessThanConfig: FieldValidateConfig<LessThanArgs> = {
    name: 'isLessThan',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the input if it is a number less than the args value',
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
            output: null
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
        return isLessThanFP(value);
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
