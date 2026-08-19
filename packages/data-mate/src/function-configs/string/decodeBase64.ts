import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const decodeBase64Config: FieldTransformConfig = {
    name: 'decodeBase64',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the base64-decoded version of the input string',
    examples: [
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
            input: 'c29tZSBzdHJpbmc=',
            output: 'some string',

        }
    ],
    create() {
        return (input: unknown) => Buffer.from(input as string, 'base64').toString('utf8');
    },
    /**
     * `coalesce(try(decode(from_base64(x))), udf(x))` - `try` does the whole job.
     *
     * DuckDB THROWS on malformed base64, which would abort the entire query, where
     * `Buffer.from(x, 'base64')` is lenient and returns mojibake: `'hello'` becomes
     * `'\ufffd\ufffde'`. Aborting a query is a far worse behaviour change than the garbage, so the
     * garbage is preserved - `try` turns every failure into NULL and the UDF then produces exactly
     * what it produces today.
     *
     * `try` rather than a validity regex because it also catches the second failure: base64 that
     * decodes to bytes which are not valid UTF-8. A regex on the input cannot see that, and one row
     * of it would abort the query.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `coalesce(try(decode(from_base64(${value}))), ${udf(value)})`,
    },
    accepts: [FieldType.String],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
            child_config
        };
    },
};
