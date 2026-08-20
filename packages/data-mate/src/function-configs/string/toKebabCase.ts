import { toKebabCase } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import {
    HAS_UNICODE_WORD, caseConvertSql,
} from './sql-utils.js';
import { sqlLiteral } from '../sql-helpers.js';

export const toKebabCaseConfig: FieldTransformConfig = {
    name: 'toKebabCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a single word joined by dashes',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'hello-there'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'billy',
            output: 'billy',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hey There',
            output: 'hey-there'
        },
    ],
    create() {
        // toKebabCase handles cases input is not string
        return (input: unknown) => toKebabCase(input as string);
    },
    /**
     * `_.kebabCase` - every word lowercased, joined with `-`.
     *
     * Only for input lodash handles with its ASCII word splitter - see `HAS_UNICODE_WORD`. Case
     * transitions, digit/letter boundaries, acronyms and anything non-ASCII take lodash's other
     * algorithm and keep the UDF.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN regexp_matches(${value},`
            + ` ${sqlLiteral(HAS_UNICODE_WORD)}) THEN ${udf(value)}`
            + ` ELSE ${caseConvertSql(value, {
                join: '-',
                first: (w) => `lower(${w})`,
                rest: (w) => `lower(${w})`,
            })} END`,
    },
    accepts: [FieldType.String]
};
