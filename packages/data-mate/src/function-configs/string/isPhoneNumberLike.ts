import { isPhoneNumberLike } from '@terascope/core-utils';
import { phoneNumberLikeSql } from './sql-utils.js';
import { STRING_FIELD_TYPES } from '../sql-helpers.js';
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
        input: '79525554602',
        output: '79525554602'
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
        input: '223457823432432423324',
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
        input: '2234',
        output: null
    }
];

export const isPhoneNumberLikeConfig: FieldValidateConfig = {
    name: 'isPhoneNumberLike',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'A simplified phone number check that returns the input if it has the basic requirements of a phone number, otherwise returns null.  Useful if the phone number\'s country is not known',
    examples,
    create() {
        return isPhoneNumberLike;
    },
    sql: {
        /**
         * Strips every non-digit and checks that 7 to 20 digits remain; see `phoneNumberLikeSql`.
         * This does not use libphonenumber.
         *
         * String columns only: for a number the digits come from `toString(input)`, and JavaScript
         * renders 1e21 as `'1e+21'` (three digits) where DuckDB renders
         * `'1000000000000000000000.0'` (22).
        */
        types: STRING_FIELD_TYPES,
        expression: ({ value }) => phoneNumberLikeSql(value),
    },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
};
