import { FieldType } from '@terascope/types';
import { startsWithFP } from '@terascope/core-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface StartsWithArgs {
    value: string;
}

export const startsWithConfig: FieldValidateConfig<StartsWithArgs> = {
    name: 'startsWith',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples: [
        {
            args: { value: 'a' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'apple',
            output: 'apple'
        },
        {
            args: { value: 'a' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'orange',
            output: null
        },
        {
            args: { value: 'so' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'some word',
            output: 'some word'
        },
        {
            args: { value: 'so' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'other word',
            output: null
        },
        {
            args: { value: 't' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'hat',
            output: null
        },
    ],
    description: 'Returns the input if it begins with the args value string. This is case-sensitive.',
    create({ args: { value } }) {
        return startsWithFP(value);
    },
    argument_schema: {
        value: {
            type: FieldType.String,
            description: 'The value that must match at the beginning of the input string '
        }
    },
    accepts: [FieldType.String],
    required_arguments: ['value'],
};
