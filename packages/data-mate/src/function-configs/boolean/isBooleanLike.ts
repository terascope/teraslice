import { isBooleanLike } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const isBooleanLikeConfig: FieldValidateConfig = {
    name: 'isBooleanLike',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.BOOLEAN,
    description: 'Returns the input if it can be converted to a boolean, otherwise returns null',
    examples: [{
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'TRUE',
        output: 'TRUE'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'false',
        output: 'false'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 1,
        output: 1
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
        return isBooleanLike;
    },
    accepts: [],
};
