import { toPascalCase } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const toPascalCaseConfig: FieldTransformConfig = {
    name: 'toPascalCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a single word joined with each starting character capitalized',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'HelloThere'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'billy',
            output: 'Billy',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hey There',
            output: 'HeyThere'
        },
    ],
    create() {
        // toPascalCase handles cases input is not string
        return (input: unknown) => toPascalCase(input as string);
    },
    accepts: [FieldType.String]
};
