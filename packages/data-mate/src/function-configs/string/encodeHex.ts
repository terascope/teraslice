import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { bufferEncode } from './encode-utils.js';

export const encodeHexConfig: FieldTransformConfig = {
    name: 'encodeHex',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a hexadecimal hashed version of the input string.',
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
            input: 'some value for hex encoding',
            output: '736f6d652076616c756520666f722068657820656e636f64696e67'
        }
    ],
    create() {
        return bufferEncode('hex');
    },
    /**
     * `hex(encode(x))`, lower-cased - `encode`, NOT `x::BLOB`.
     *
     * A `VARCHAR -> BLOB` cast refuses non-ASCII input; `encode()` is the UTF-8 conversion. Lower-case
     * to match `Buffer.toString('hex')`. Verified equal for ASCII, Latin-1, CJK and astral input.
    */
    sql: {
        expression: ({ value }) => `lower(hex(encode(${value})))`,
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
