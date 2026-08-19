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
     * `coalesce(try(decode(unhex(x))), udf(x))` - `try` does the whole job.
     *
     * Three ways this throws in DuckDB and does not in JavaScript: a non-hex digit, an odd length, and
     * valid hex whose bytes are not valid UTF-8 (`'0123456789'` decodes to a byte `0x89`). Each would
     * abort the query, while `Buffer.from(x, 'hex')` stops at the first bad pair - `'hello'` gives
     * `''`, `'686'` gives `'h'` - and replaces bad bytes with U+FFFD. `try` turns all three into NULL,
     * and the UDF then reproduces today's answer exactly.
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
