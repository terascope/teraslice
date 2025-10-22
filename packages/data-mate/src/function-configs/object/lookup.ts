import { lookup } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig, DataTypeFieldAndChildren
} from '../interfaces.js';

export interface LookupArgs {
    readonly in: Record<string, unknown> | string | any[];
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
            args: { in: ['foo', 'bar', 'max'] },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 2,
            output: 'max'
        }
    ],
    create({ args }) {
        return lookup(args.in);
    },
    argument_schema: {
        in: {
            type: FieldType.Any,
            array: false,
            description: 'Data set that is used for the key lookup. Can be an object, array, or formatted string (see example). Keys must be strings or numbers.'
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
