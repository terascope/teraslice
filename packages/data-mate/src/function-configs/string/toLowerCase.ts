import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { isAsciiSql } from '../sql-helpers.js';

function _toLowerCase(input: unknown): string {
    return String(input).toLowerCase();
}

export const toLowerCaseConfig: FieldTransformConfig = {
    name: 'toLowerCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a string to lower case characters',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'hello there'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'biLLy',
            output: 'billy',
        }
    ],
    create() {
        return _toLowerCase;
    },
    /**
     * `lower()` for ASCII values, the UDF for everything else.
     *
     * JavaScript applies full Unicode case mapping and DuckDB applies simple mapping, so they
     * differ on inputs like `'ß'` and `'ﬁ'`. They agree on every ASCII character, so only non-ASCII
     * values pay for a UDF call.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isAsciiSql(value)}`
            + ` THEN lower(${value}) ELSE ${udf(value)} END`,
    },
    accepts: [FieldType.String]
};
