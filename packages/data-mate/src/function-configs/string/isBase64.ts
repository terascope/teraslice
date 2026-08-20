import { isBase64 } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';
import { isBase64Sql } from './sql-utils.js';

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
    /**
     * **The SQL is correct where the JavaScript is not**, so the SQL is the behaviour.
     *
     * `core-utils`' `isBase64` calls `validator.isBase64` and then requires the value to survive
     * `Buffer.from(x, 'base64').toString('utf8')` re-encoded back to base64. That round trip is
     * lossy for any byte sequence that is not valid UTF-8, so the function **rejects 99.3% of
     * valid base64-encoded binary** while accepting 100% of base64-encoded ASCII text - measured,
     * 2,000 random payloads each. Base64 exists to carry binary, so the check fails at its own
     * purpose.
     *
     * The emission is RFC 4648 with padding, which is `validator`'s default and the right answer.
     * Every divergence is listed in the gate with the correct value; the write-up is
     * `docs/known-defects.md` DF9.
    */
    sql: {
        expression: ({ value }) => isBase64Sql(value),
    },
    accepts: [FieldType.String],
};
