import { isISDN, isCountryCode } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample,
} from '../interfaces.js';

export interface IsISDNArgs {
    country?: string;
}

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
        input: '46707123456',
        output: '46707123456'
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
        input: '1-808-915-6800',
        output: '1-808-915-6800'
    },
    {
        args: { country: 'US' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: '8089156800',
        output: '8089156800'
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
        input: '8089156800',
        output: null
    }
];

export const isISDNConfig: FieldValidateConfig<IsISDNArgs> = {
    name: 'isISDN',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a valid phone number.  If the country arg is not provided then it is processed as an international formatted phone number',
    create({ args: { country } }) {
        return (input: unknown) => isISDN(input, country);
    },
    examples,
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        country: {
            type: FieldType.String,
            description: 'A valid ISO 3166-1 alpha-2 officially assigned country code'
        }
    },
    required_arguments: [],
    validate_arguments({ country }) {
        if (country != null && !isCountryCode(country)) {
            throw new Error('Invalid country, the country must be a ISO 3166-1 alpha-2 officially assigned country code');
        }
    }
};
