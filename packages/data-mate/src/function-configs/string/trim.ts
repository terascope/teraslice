import {
    trimFP
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

export interface TrimArgs {
    chars?: string;
}

const examples: FunctionDefinitionExample<TrimArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '   other_things         ',
        output: 'other_things'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'Stuff        ',
        output: 'Stuff'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '      hello',
        output: 'hello'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '       ',
        output: ''
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'Spider Man',
        output: 'Spider Man'
    },
    {
        args: { chars: 'a' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'aaaaSpider Manaaaa',
        output: 'Spider Man'
    },
    {
        args: { chars: 'a' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'aa aaSpider Manaa aa',
        output: ' aaSpider Manaa ',
        description: 'Any new char, including whitespace will stop the trim, it must be consecutive'
    },
    {
        args: { chars: 'fast' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'fast cars race fast',
        output: ' cars race ',
    },
    {
        args: { chars: 'fatc ' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'fast example cata',
        output: 'st example',
    },
    {
        args: { chars: '\r' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '\t\r\rtrim this\r\r',
        output: '\t\r\rtrim this',
    },
    {
        args: { chars: '.*' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '.*.*a test.*.*.*.*',
        output: 'a test',
    },
];

export const trimConfig: FieldTransformConfig<TrimArgs> = {
    name: 'trim',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Trims whitespace or characters from the beginning and end of a string',
    examples,
    create({ args: { chars } }) {
        return trimFP(chars);
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
