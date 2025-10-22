import { containsFP } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface ContainsArgs {
    readonly value: string;
}

export const containsConfig: FieldValidateConfig<ContainsArgs> = {
    name: 'contains',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input string if it contains the args substring value, otherwise returns null. This operations is case-sensitive',
    examples: [
        {
            args: { value: 'ample' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'example',
            output: 'example'
        },
        {
            args: { value: 'example' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'example',
            output: 'example'
        },
        {
            args: { value: 'test' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'example',
            output: null
        },
    ],
    create({ args: { value } }) {
        return containsFP(value);
    },
    accepts: [FieldType.String],
    argument_schema: {
        value: {
            type: FieldType.String,
            array: false,
            description: 'A string that must partially or completely match'
        }
    },
    required_arguments: ['value']
};
