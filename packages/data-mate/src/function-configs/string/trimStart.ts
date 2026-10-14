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
import { JS_WHITESPACE, sqlLiteral } from '../sql-helpers.js';

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
    /**
     * `ltrim(x, chars)`, always with an explicit character set.
     *
     * DuckDB's one-argument `ltrim(x)` strips only spaces, while JavaScript strips all Unicode
     * whitespace, including tabs and newlines. Passing `JS_WHITESPACE` makes them agree.
    */
    sql: {
        expression: ({ value, args }) => `ltrim(${value}, `
            + `${sqlLiteral(args.chars == null ? JS_WHITESPACE : args.chars)})`,
    },
    argument_schema: {
        chars: {
            type: FieldType.String,
            array: false,
            description: 'The characters to remove, defaults to whitespace'
        }
    }
};
