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
     * `lower()` for ASCII, JavaScript for everything else.
     *
     * A plain `lower(x)` is NOT equal to JavaScript's: JavaScript applies full Unicode case
     * mapping and DuckDB applies simple mapping, so they diverge on inputs like `'ß'` and
     * `'ﬁ'`. Inside ASCII they agree on all 127 code points, so the guard takes the native
     * path for data that is almost always ASCII and pays for a UDF call only where it must.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isAsciiSql(value)}`
            + ` THEN lower(${value}) ELSE ${udf(value)} END`,
    },
    accepts: [FieldType.String]
};
