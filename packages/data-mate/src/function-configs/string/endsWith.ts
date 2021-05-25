import { FieldType } from '@terascope/types';
import { endsWithFP } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export interface EndsWithArgs {
    value: string
}

export const endsWithConfig: FieldValidateConfig<EndsWithArgs> = {
    name: 'endsWith',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples: [
        {
            args: { value: 'e' },
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
            output: null
        },
        {
            args: { value: 'word' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'other word',
            output: 'other word'
        },
    ],
    description: 'Validation that determines whether or not a string ends with another string. This is case-sensitive.',
    create({ args: { value } }) {
        return endsWithFP(value);
    },
    argument_schema: {
        value: {
            type: FieldType.String,
            description: 'The value that must match at the end of the input string '
        }
    },
    accepts: [FieldType.String],
    required_arguments: ['value'],
};
