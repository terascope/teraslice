import {
    trimEndFP
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

export interface TrimEndArgs {
    chars?: string;
}

const examples: FunctionDefinitionExample<TrimEndArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '   left',
        output: '   left'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'right   ',
        output: 'right'
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
        output: '*****Hello****Bob'
    },
    {
        args: { chars: 'fast' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'fast cars race fast',
        output: 'fast cars race '
    },
];

export const trimEndConfig: FieldTransformConfig<TrimEndArgs> = {
    name: 'trimEnd',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Trims whitespace or characters from the end of a string',
    examples,
    create({ args: { chars } }) {
        return trimEndFP(chars);
    },
    accepts: [FieldType.String],
    /**
     * `rtrim(x, chars)` - always with an explicit character set, never the one-argument form.
     *
     * DuckDB's `rtrim(x)` strips only SPACES where JavaScript strips every Unicode whitespace
     * code point, so the one-argument form silently differs on tabs and newlines. Passing
     * `JS_WHITESPACE` makes them agree on all 25 of those code points.
    */
    sql: {
        expression: ({ value, args }) => `rtrim(${value}, `
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
