import { isCountryCode } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';
import { ISO_3166_ALPHA2 } from './sql-validator-utils.js';
import { isAsciiSql, sqlLiteral } from '../sql-helpers.js';

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
                    type: FieldType.String
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
    description: 'Returns the input if it is a valid ISO 3166-1 alpha-2 country code, otherwise returns null.',
    create() {
        return isCountryCode;
    },
    sql: {
        /**
         * **A 249-entry set lookup on `upper(x)`** - that is the entire function, see
         * `ISO_3166_ALPHA2`. `core-utils` does not pass `userAssignedCodes`, so nothing else in
         * `validator.isISO31661Alpha2` is reachable. Calling it a "locale table" put it in the same
         * bucket as `isPostalCode`, which really is one.
         *
         * ASCII only, and the reason is specific: JavaScript's `toUpperCase` is FULL case mapping
         * and can change a string's LENGTH, so `'\ufb01'` uppercases to `'FI'` - a real country
         * code - where DuckDB's simple mapping leaves it as one character.
        */
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN NOT ${isAsciiSql(value)} THEN ${udf(value)}`
            + ` ELSE upper(${value}) IN (${ISO_3166_ALPHA2.map(sqlLiteral).join(', ')}) END`,
    },
    accepts: [FieldType.String]
};
