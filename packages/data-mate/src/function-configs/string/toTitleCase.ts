import { toTitleCase } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { HAS_UNICODE_WORD, caseConvertSql, upperFirstSql } from './sql-utils.js';
import { sqlLiteral } from '../sql-helpers.js';

export const toTitleCaseConfig: FieldTransformConfig = {
    name: 'toTitleCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a whitespace separated string with each word starting with a capital letter',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'HELLO There'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'billy',
            output: 'Billy',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hey There',
            output: 'Hey There'
        },
    ],
    create() {
        // toTitleCase handles cases input is not string
        return (input: unknown) => toTitleCase(input as string);
    },
    /**
     * `_.startCase`: each word's first character uppercased and the rest left as is, joined with a
     * space. This is not `capitalize`: `startCase('HELLO')` is `'HELLO'`.
     *
     *  Only for input that lodash splits with its ASCII word splitter; see `HAS_UNICODE_WORD`.
     * Other input keeps the UDF.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN regexp_matches(${value},`
            + ` ${sqlLiteral(HAS_UNICODE_WORD)}) THEN ${udf(value)}`
            + ` ELSE ${caseConvertSql(value, {
                join: ' ',
                first: (w) => upperFirstSql(w),
                rest: (w) => upperFirstSql(w),
            })} END`,
    },
    accepts: [FieldType.String],
};
