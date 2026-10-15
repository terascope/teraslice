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
     * `lower(hex(encode(x)))`. This uses `encode`, not `x::BLOB`.
     *
     * A `VARCHAR` to `BLOB` cast rejects non-ASCII input, while `encode()` converts to UTF-8. The
     * result is lowercased to match `Buffer.toString('hex')`.
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
