import { isPort } from '@terascope/core-utils';
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
    description: 'Returns the input it it is a valid TCP or UDP port, otherwise returns null.',
    examples,
    create() {
        return isPort;
    },
    /**
     * `validator.isPort` is `isInt(x, { min: 0, max: 65535 })`, and the INT part is the fiddly
     * half.
     *
     * Measured: `'007'` is FALSE - a leading zero is not an integer to `validator` - while `'+80'`
     * is TRUE, and `' 80'` and `'80.5'` are false. So the regex is the definition and the range
     * check follows it.
    */
    sql: {
        types: [FieldType.String],
        expression: ({ value }) => `(regexp_matches(${value}, '^[+-]?(0|[1-9][0-9]*)$')`
            + ` AND TRY_CAST(${value} AS BIGINT) BETWEEN 0 AND 65535)`,
    },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
};
