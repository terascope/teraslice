import { isCountryCode } from '@terascope/utils';
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
        input: 'US',
        output: 'US'
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
        input: 'ZM',
        output: 'ZM'
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
        input: 'GB',
        output: 'GB'
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
        input: 'UK',
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
        input: 12345,
        output: null
    }
];

export const isCountryCodeConfig: FieldValidateConfig = {
    name: 'isCountryCode',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples,
    description: 'Checks to see if input is a valid ISO 3166-1 alpha-2 country code',
    create() { return isCountryCode; },
    accepts: [FieldType.String],
};
