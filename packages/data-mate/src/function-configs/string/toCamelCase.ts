import { toCamelCase } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import {
    HAS_UNICODE_WORD, caseConvertSql, capitalizeSql,
} from './sql-utils.js';
import { sqlLiteral } from '../sql-helpers.js';

export const toCamelCaseConfig: FieldTransformConfig = {
    name: 'toCamelCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'helloThere'
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
            output: 'heyThere'
        },
    ],
    description: 'Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase',
    create() {
        // toCamelCase handles cases input is not string
        return (input: unknown) => toCamelCase(input as string);
    },
    /**
     * `_.camelCase` - first word lowercased, the rest capitalised, no separator.
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
                join: '',
                first: (w) => `lower(${w})`,
                rest: (w) => capitalizeSql(w),
            })} END`,
    },
    accepts: [FieldType.String],
};
