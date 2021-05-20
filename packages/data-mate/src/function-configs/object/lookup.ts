import { lookup } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface LookupArgs {
    readonly lookupObj: Record<string, unknown>
}

export const lookupConfig: FieldTransformConfig<LookupArgs> = {
    name: 'lookup',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.OBJECT,
    description: 'Returns value based on key value lookup ',
    examples: [
        {
            args: { lookupObj: { key1: 'value1', key2: 'value2' } },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: 'key1',
            output: 'value1'
        },
        {
            args: { lookupObj: { 123: 4567, 8910: 1112 } },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 8910,
            output: 1112
        }
    ],
    create({ lookupObj }: LookupArgs): any {
        return lookup(lookupObj);
    },
    argument_schema: {
        lookupObj: {
            type: FieldType.Object,
            array: false,
            description: 'Object to use for key lookup'
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
