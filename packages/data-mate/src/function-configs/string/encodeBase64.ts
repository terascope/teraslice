import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { bufferEncode } from './encode-utils.js';

export const encodeBase64Config: FieldTransformConfig = {
    name: 'encodeBase64',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a base64 hashed version of the input string',
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
            input: 'some string',
            output: 'c29tZSBzdHJpbmc='
        }
    ],
    create() {
        return bufferEncode('base64');
    },
    /**
     * `to_base64(encode(x))` - `encode`, NOT `x::BLOB`.
     *
     * A `VARCHAR -> BLOB` cast REFUSES non-ASCII input: "All non-ascii characters must be escaped with
     * hex codes". `encode()` is the UTF-8 conversion, and with it the output matches
     * `Buffer.from(input, 'utf8').toString('base64')` exactly, including for astral characters.
    */
    sql: {
        expression: ({ value }) => `to_base64(encode(${value}))`,
    },
    accepts: [FieldType.String],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;
        // NOTE: encoding might need to mutate child_config
        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
            child_config
        };
    },
};
