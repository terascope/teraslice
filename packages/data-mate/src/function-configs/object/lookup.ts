import { lookup } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig, DataTypeFieldAndChildren
} from '../interfaces';

export interface LookupArgs {
    readonly in: Record<string, unknown> | string | any[];
    match_required?: boolean;
}

export const lookupConfig: FieldTransformConfig<LookupArgs> = {
    name: 'lookup',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.OBJECT,
    description: 'Matches the input to a key in a table and returns the corresponding value.',
    examples: [
        {
            args: { in: { key1: 'value1', key2: 'value2' } },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: 'key1',
            output: 'value1'
        },
        {
            args: { in: { 123: 4567, 8910: 1112 } },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 8910,
            output: 1112
        },
        {
            args: { in: { key1: 'value1', key2: 'value2' } },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: 'key3',
            output: undefined
        },
        {
            args: {
                in: `
                    1:foo
                    2:bar
                    3:max
                `
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 2,
            output: 'bar'
        },
        {
            args: { in: ['foo', 'bar', 'max'] },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 2,
            output: 'max'
        },
        {
            args: { in: { key1: 'value1', key2: 'value2' }, match_required: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: 'key3',
            output: 'key3'
        },
        {
            args: {
                in: '132:foo\n232:bar'
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 132,
            output: 'foo'
        }
    ],
    create({ args }) {
        return lookup(args);
    },
    argument_schema: {
        in: {
            type: FieldType.Any,
            array: false,
            description: 'Data set that is used for the key lookup. Can be an object, array, or formatted string (see example). Keys must be strings or numbers.'
        },
        match_required: {
            type: FieldType.Boolean,
            array: false,
            description: 'If set to true lookup returns the input if the input is not found in the table.  If false or missing, lookup returns null if the input is not found in the table',
        }
    },
    accepts: [FieldType.Number, FieldType.String],
    required_arguments: ['in'],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                array: false,
                type: FieldType.Any
            },
            child_config: undefined
        };
    }
};
