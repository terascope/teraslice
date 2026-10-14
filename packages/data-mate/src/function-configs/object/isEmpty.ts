import { FieldType } from '@terascope/types';
import { isString, isEmpty } from '@terascope/core-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';
import {
    STRING_FIELD_TYPES, NUMERIC_FIELD_TYPES, JS_WHITESPACE, sqlLiteral,
} from '../sql-helpers.js';

export interface EmptyArgs {
    /** Trims string input */
    readonly ignoreWhitespace?: boolean;
}

const examples: FunctionDefinitionExample<EmptyArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
        output: null
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '',
        output: ''
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String, array: true } } },
        field: 'testField',
        input: [],
        output: []
    },
];

export const isEmptyConfig: FieldValidateConfig<EmptyArgs> = {
    name: 'isEmpty',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.OBJECT,
    description: 'Returns the input if it is empty, otherwise returns null.',
    examples,
    /**
     * A constant `TRUE` for a number or boolean column, and `x = ''` for a string column.
     *
     * This follows the implementation rather than the name. `isEmpty` returns true for a falsy
     * value, then checks `.size`, `.length`, errors, buffers, iterators and objects, and returns
     * true when none of those apply. So `isEmpty(5)` and `isEmpty(true)` are both true, and only a
     * string's result depends on its value.
     *
     * With `ignoreWhitespace` the string is trimmed first, passing `JS_WHITESPACE` because DuckDB's
     * one-argument `trim` strips only spaces.
    */
    sql: {
        applies: (_args, inputConfig) => !inputConfig?.field_config?.array
            && [...STRING_FIELD_TYPES, ...NUMERIC_FIELD_TYPES, FieldType.Boolean]
                .includes(inputConfig.field_config.type as FieldType),
        expression: ({ value, args, inputConfig }) => {
            const type = inputConfig.field_config.type as FieldType;
            if (!STRING_FIELD_TYPES.includes(type)) return 'TRUE';
            const subject = args.ignoreWhitespace
                ? `trim(${value}, ${sqlLiteral(JS_WHITESPACE)})`
                : value;
            return `${subject} = ''`;
        },
    },
    accepts: [],
    create({ args: { ignoreWhitespace } }) {
        return (input: unknown) => isEmptyFn(input, ignoreWhitespace);
    },
    argument_schema: {
        ignoreWhitespace: {
            type: FieldType.Boolean,
            array: false,
            description: 'If input is a string, it will attempt to trim it before validating it'
        }
    }
};

function isEmptyFn(
    input: unknown, ignoreWhitespace = false
): boolean {
    let value = input;

    if (isString(value) && ignoreWhitespace) {
        value = value.trim();
    }

    return isEmpty(value);
}
