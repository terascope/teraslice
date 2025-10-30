import { isBase64 } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'ZnJpZW5kbHlOYW1lNw==',
        output: 'ZnJpZW5kbHlOYW1lNw=='
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'manufacturerUrl7',
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Number
                }
            }
        },
        field: 'testField',
        input: 1234123,
        output: null
    }
];

export const isBase64Config: FieldValidateConfig = {
    name: 'isBase64',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples,
    description: 'Returns the input if it is a valid base64 string, otherwise returns null.',
    create() {
        return isBase64;
    },
    accepts: [FieldType.String],
};
