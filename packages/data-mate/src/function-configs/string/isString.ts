import { isString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces.js';

export const isStringConfig: FieldValidateConfig = {
    name: 'isString',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'this is a string',
            output: 'this is a string',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '12345',
            output: '12345',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Object } } },
            field: 'testField',
            input: { hello: 'i am an object' },
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Number } } },
            field: 'testField',
            input: 1234,
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String, array: true } } },
            field: 'testField',
            input: ['12345', 'some more stuff'],
            output: ['12345', 'some more stuff'],
        },
    ],
    description: 'Returns the input if it is is a string, otherwise returns null.',
    create() {
        return isString;
    },
    accepts: [FieldType.String],
};
