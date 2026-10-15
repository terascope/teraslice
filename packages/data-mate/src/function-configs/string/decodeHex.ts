import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const decodeHexConfig: FieldTransformConfig = {
    name: 'decodeHex',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the hexadecimal-decoded version of the input string',
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
            input: '736f6d652076616c756520666f722068657820656e636f64696e67',
            output: 'some value for hex encoding',
        }
    ],
    create() {
        return (input: unknown) => Buffer.from(input as string, 'hex').toString('utf8');
    },
    /**
     * `coalesce(try(decode(unhex(x))), udf(x))`.
     *
     * DuckDB throws on a non-hex digit, on an odd length, and on hex whose bytes are not valid
     * UTF-8 (`'0123456789'` decodes to a byte `0x89`). JavaScript does not throw: `Buffer.from(x,
     * 'hex')` stops at the first bad pair (`'hello'` gives `''`, `'686'` gives `'h'`) and replaces
     * invalid bytes with U+FFFD. `try` turns each DuckDB error into NULL, and the UDF supplies the
     * JavaScript result.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `coalesce(try(decode(unhex(${value}))), ${udf(value)})`,
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
    }
};
