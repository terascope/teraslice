import { isBoolean } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const isBooleanConfig: FieldValidateConfig = {
    name: 'isBoolean',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.BOOLEAN,
    description: 'Returns the input if it is a boolean, otherwise returns null',
    examples: [{
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'TRUE',
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Boolean } }
        },
        field: 'testField',
        input: false,
        output: false
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 1,
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102,
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'example',
        output: null
    }],
    create() {
        return isBoolean;
    },
    accepts: [],
};
