import { isPort } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces';

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
        input: '49151',
        output: '49151'
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
        input: '80',
        output: '80'
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
        input: '65536',
        output: null
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
        input: 'not a port',
        output: null
    }
];

export const isPortConfig: FieldValidateConfig = {
    name: 'isPort',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid port',
    examples,
    create() { return isPort; },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
};
