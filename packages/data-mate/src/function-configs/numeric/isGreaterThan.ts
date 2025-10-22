import { FieldType } from '@terascope/types';
import { isGreaterThanFP } from '@terascope/core-utils';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface GreaterThanArgs {
    readonly value: number;
}

export const isGreaterThanConfig: FieldValidateConfig<GreaterThanArgs> = {
    name: 'isGreaterThan',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the input if it is greater than the args value',
    examples: [
        {
            args: { value: 100 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
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
            input: 120,
            output: 120
        },
        {
            args: { value: 150 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 151,
            output: 151
        }
    ],
    create({ args: { value } }) {
        return isGreaterThanFP(value);
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
