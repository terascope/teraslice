import { contains } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export interface ContainsArgs {
    readonly substr: string;
}

export const containsConfig: FieldValidateConfig<ContainsArgs> = {
    name: 'contains',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input string if it contains the args substring value, otherwise returns null. This operations is case-sensitive',
    examples: [
        {
            args: { substr: 'ample' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'example',
            output: 'example'
        },
        {
            args: { substr: 'example' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'example',
            output: 'example'
        },
        {
            args: { substr: 'test' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'example',
            output: null
        },
    ],
    create({ args: { substr } }) {
        return (input: unknown) => contains(input, substr);
    },
    accepts: [FieldType.String],
    argument_schema: {
        substr: {
            type: FieldType.String,
            array: false,
            description: 'A string that must partially or completely match'
        }
    },
    required_arguments: ['substr']
};
