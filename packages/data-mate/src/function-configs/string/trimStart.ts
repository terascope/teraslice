import {
    trimStartFP
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

export interface TrimStartArgs {
    chars?: string;
}

const examples: FunctionDefinitionExample<TrimStartArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '    Hello Bob    ',
        output: 'Hello Bob    '
    },
    {
        args: { chars: '__--' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '__--__--__some__--__word',
        output: 'some__--__word'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '       ',
        output: ''
    },
    {
        args: { chars: '*' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '*****Hello****Bob*****',
        output: 'Hello****Bob*****'
    }
];

export const trimStartConfig: FieldTransformConfig<TrimStartArgs> = {
    name: 'trimStart',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Trims whitespace or characters from the start of a string',
    examples,
    create({ args: { chars } }) {
        return trimStartFP(chars);
    },
    accepts: [FieldType.String],
    argument_schema: {
        chars: {
            type: FieldType.String,
            array: false,
            description: 'The characters to remove, defaults to whitespace'
        }
    }
};
