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
     * `coalesce(try(decode(from_base64(x))), udf(x))`.
     *
     * DuckDB throws on malformed base64, which would abort the whole query, while `Buffer.from(x,
     * 'base64')` is lenient and returns garbled text (`'hello'` becomes `'��e'`). `try` turns the
     * error into NULL, and the UDF then returns the same garbled text as JavaScript.
     *
     * `try` is used rather than a validity regex because it also catches base64 that decodes to
     * invalid UTF-8, which a regex on the input cannot detect.
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
