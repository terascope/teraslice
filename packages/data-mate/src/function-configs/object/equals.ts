import { isDeepEqualFP } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample,
} from '../interfaces.js';
import { primitiveLiteral, literalMatchesColumn } from '../sql-helpers.js';

export interface EqualsArgs {
    readonly value: unknown;
}

const examples: FunctionDefinitionExample<EqualsArgs>[] = [
    {
        args: { value: 'thisisastring' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'thisisastring',
        output: 'thisisastring'
    },
    {
        args: { value: 'thisisastring' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 1234,
        output: null
    },
    {
        args: { value: ['an', 'array', 'of', 'values'] },
        config: { version: 1, fields: { testField: { type: FieldType.String, array: true } } },
        field: 'testField',
        input: ['an', 'array', 'of', 'values'],
        output: ['an', 'array', 'of', 'values']
    },
    {
        args: { value: { foo: 'bar', deep: { value: 'kitty' } } },
        config: { version: 1, fields: { testField: { type: FieldType.Object } } },
        field: 'testField',
        input: { foo: 'bar', deep: { value: 'kitty' } },
        output: { foo: 'bar', deep: { value: 'kitty' } }
    },
    {
        args: { value: { foo: 'bar', deep: { value: 'kitty' } } },
        config: { version: 1, fields: { testField: { type: FieldType.Object } } },
        field: 'testField',
        input: { foo: 'bar', deep: { value: 'other stuff' } },
        output: null
    },
    {
        args: { value: true },
        config: { version: 1, fields: { testField: { type: FieldType.Boolean } } },
        field: 'testField',
        input: false,
        output: null
    },
];

export const equalsConfig: FieldValidateConfig<EqualsArgs> = {
    name: 'equals',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.OBJECT,
    description: 'Returns the input if it matches the args value, otherwise returns null.',
    examples,
    create({ args: { value } }) {
        return isDeepEqualFP(value);
    },
    /**
     * A plain comparison, for a scalar column against a primitive argument.
     *
     * `isDeepEqual` is structural, and neither an object nor an array has a literal form here, so
     * `applies` keeps those on the UDF. The kinds must match too: `coalesce`-style implicit casting
     * would be DuckDB deciding how `5` becomes a string, where the UDF path never converts at all.
    */
    sql: {
        applies: (args, inputConfig) => primitiveLiteral(args.value) != null
            && !inputConfig?.field_config?.array
            && literalMatchesColumn(args.value, inputConfig.field_config.type as FieldType),
        expression: ({ value, args }) => `${value} = ${primitiveLiteral(args.value)}`,
    },
    accepts: [],
    argument_schema: {
        value: {
            type: FieldType.Any,
            array: false,
            description: 'Value to use in the comparison'
        }
    },
    required_arguments: ['value']
};
