import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { isAsciiSql } from '../sql-helpers.js';

function _toUpperCase(input: unknown): string {
    return String(input).toUpperCase();
}

export const toUpperCaseConfig: FieldTransformConfig = {
    name: 'toUpperCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a string to upper case characters',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'hello',
            output: 'HELLO'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'billy',
            output: 'BILLY',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hey There',
            output: 'HEY THERE'
        },
    ],
    create() {
        return _toUpperCase;
    },
    accepts: [FieldType.String],
    /**
     * `upper()` for ASCII values, the UDF for everything else.
     *
     * JavaScript applies full Unicode case mapping and DuckDB applies simple mapping, so they
     * differ on inputs like `'ß'` and `'ﬁ'`. They agree on every ASCII character, so only non-ASCII
     * values pay for a UDF call.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isAsciiSql(value)}`
            + ` THEN upper(${value}) ELSE ${udf(value)} END`,
    },
};
