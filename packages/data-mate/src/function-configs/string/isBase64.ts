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
     * RFC 4648 base64 with padding, `validator.isBase64`'s default. This intentionally differs from
     * the JavaScript implementation.
     *
     * `core-utils`' `isBase64` calls `validator.isBase64` and then requires the value to survive a
     * round trip through `Buffer.from(x, 'base64').toString('utf8')`. That round trip loses any
     * bytes that are not valid UTF-8, so it rejects nearly all valid base64-encoded binary while
     * accepting base64-encoded text. The SQL checks the base64 itself and accepts both.
    */
    sql: {
        expression: ({ value }) => isBase64Sql(value),
    },
    accepts: [FieldType.String],
};
