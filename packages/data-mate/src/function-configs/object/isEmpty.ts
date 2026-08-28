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
     * **A CONSTANT for a number or a boolean, and `x = ''` for a string** - which is what the
     * implementation actually does, not what the name suggests.
     *
     * `isEmpty` starts with `if (!_val) return true`, then looks for `.size`, `.length`, an Error,
     * a Buffer, an iterator, an object - and if none of those match, `return true`. A number that
     * is not zero reaches that last line, so `isEmpty(5)` is TRUE; so is `isEmpty(true)`. Only a
     * string has a `.length` for the check to consult, which makes it the one type where the
     * answer depends on the value.
     *
     * `ignoreWhitespace` trims first, and `JS_WHITESPACE` is passed explicitly because DuckDB's
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
