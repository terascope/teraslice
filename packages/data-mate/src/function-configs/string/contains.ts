import { contains } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface ContainsArgs {
    readonly substr: string;
}

export const containsConfig: FieldValidateConfig<ContainsArgs> = {
    name: 'contains',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if string contains substring. This operations is case-sensitive',
    examples: [
        {
            args: { substr: 'ample' },
            config: { version: 1, fields: { example: { type: FieldType.String } } },
            field: 'example',
            input: 'example',
            output: 'example'
        },
        {
            args: { substr: 'example' },
            config: { version: 1, fields: { example: { type: FieldType.String } } },
            field: 'example',
            input: 'example',
            output: 'example'
        },
        {
            args: { substr: 'test' },
            config: { version: 1, fields: { example: { type: FieldType.String } } },
            field: 'example',
            input: 'example',
            output: null
        },
    ],
    create({ substr }) {
        return (input: unknown) => contains(input, substr);
    },
    accepts: [],
    argument_schema: {
        substr: {
            type: FieldType.String,
            array: false,
            description: 'A string that must partially or completely match'
        }
    }
};
