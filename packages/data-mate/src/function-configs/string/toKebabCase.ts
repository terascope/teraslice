import { toKebabCase } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const toKebabCaseConfig: FieldTransformConfig = {
    name: 'toKebabCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a single word joined by dashes',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'hello-there'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'billy',
            output: 'billy',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hey There',
            output: 'hey-there'
        },
    ],
    create() {
        // toKebabCase handles cases input is not string
        return (input: unknown) => toKebabCase(input as string);
    },
    accepts: [FieldType.String]
};
