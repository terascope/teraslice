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
     * `upper()` for ASCII, JavaScript for everything else.
     *
     * A plain `upper(x)` is NOT equal to JavaScript's: JavaScript applies full Unicode case
     * mapping and DuckDB applies simple mapping, so they diverge on inputs like `'ß'` and `'ﬁ'`.
     * Inside ASCII they agree on all 127 code points, so the guard picks the native path for the
     * data that is almost always ASCII and pays for a UDF call only on the values that need it.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isAsciiSql(value)}`
            + ` THEN upper(${value}) ELSE ${udf(value)} END`,
    },
};
