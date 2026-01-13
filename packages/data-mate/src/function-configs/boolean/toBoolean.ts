import { toBoolean } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    DataTypeFieldAndChildren, FunctionDefinitionCategory
} from '../interfaces.js';

export const toBooleanConfig: FieldTransformConfig = {
    name: 'toBoolean',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.BOOLEAN,
    description: 'Converts the input into a boolean and returns the boolean value',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: 'TRUE',
            output: true
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1,
            output: true
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 0,
            output: false
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Any } }
            },
            field: 'testField',
            input: null,
            output: null
        }
    ],
    create() {
        return toBoolean;
    },
    accepts: [],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Boolean
            },
        };
    }
};
