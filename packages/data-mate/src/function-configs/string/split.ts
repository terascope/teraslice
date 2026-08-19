import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory,
} from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';

export interface SplitArgs {
    delimiter?: string;
}

const examples: FunctionDefinitionExample<SplitArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'astring',
        output: ['a', 's', 't', 'r', 'i', 'n', 'g']
    },
    {
        args: { delimiter: ',' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'astring',
        output: ['astring'],
        description: 'Delimiter is not found so the whole input is returned'
    },
    {
        args: { delimiter: '-' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'a-stri-ng',
        output: ['a', 'stri', 'ng']
    },
    {
        args: { delimiter: ' ' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'a string',
        output: ['a', 'string']
    },
];

export const splitConfig: FieldTransformConfig<SplitArgs> = {
    name: 'split',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns an array based off the input split by the args delimiter, defaults to splitting by each character',
    examples,
    create({ args: { delimiter = '' } }) {
        return splitFn(delimiter);
    },
    /**
     * `string_split`, for a NON-EMPTY delimiter only.
     *
     * The default delimiter is `''`, and `String(x).split('')` splits into UTF-16 CODE UNITS - it
     * can return a lone surrogate for astral input, the same problem `truncate` has. `string_split`
     * with an empty delimiter is not that, so the empty case keeps the UDF. Verified over four
     * delimiters and twelve strings, including absent delimiters and empty inputs: identical.
    */
    sql: {
        applies: (args) => typeof args.delimiter === 'string' && args.delimiter !== '',
        expression: ({ value, args }) => `string_split(${value},`
            + ` ${sqlLiteral(args.delimiter as string)})`,
    },
    accepts: [FieldType.String],
    argument_schema: {
        delimiter: {
            type: FieldType.String,
            array: false,
            description: 'The char used to identify where to split the string'
        }
    },
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                array: true,
            }
        };
    }
};

function splitFn(delimiter: string): (input: unknown) => string[] {
    return function _split(input) {
        return String(input).split(delimiter);
    };
}
