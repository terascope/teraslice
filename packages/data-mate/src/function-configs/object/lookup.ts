import { lookup } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface LookupArgs {
    readonly in: Record<string, unknown>
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
        }
    ],
    create(args: LookupArgs): any {
        return lookup(args.in);
    },
    argument_schema: {
        in: {
            type: FieldType.Object,
            array: false,
            description: 'Object or table that is used for the key lookup.  Keys must strings or numbers.'
        }
    },
    accepts: [FieldType.Number, FieldType.String],
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
