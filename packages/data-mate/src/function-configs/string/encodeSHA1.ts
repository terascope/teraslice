import { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
    EncodeSHA1Config
} from '../interfaces';
import { cryptoEncode } from './encode-utils';

const defaultDigest: BinaryToTextEncoding = 'hex';

export const encodeSHA1Config: FieldTransformConfig<EncodeSHA1Config> = {
    name: 'encodeSHA1',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Returns a SHA1 encoded version of the input value',
    category: FunctionDefinitionCategory.STRING,
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
            input: '{ "some": "data" }',
            output: 'e8cb1404796eba6779a276377cce99a502a36481',
            description: 'If the digest is not provided, it defaults to hex'
        },
        {
            args: { digest: 'base64' },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String
                    }
                }
            },
            field: 'testField',
            input: '{ "some": "data" }',
            output: '6MsUBHluumd5onY3fM6ZpQKjZIE='
        }
    ],
    create({ args: { digest = defaultDigest } }) {
        return cryptoEncode('sha1', digest);
    },
    accepts: [FieldType.String],
    argument_schema: {
        digest: {
            type: FieldType.String,
            array: false,
            description: 'Hash digest to used, may be set to either "base64" or "hex", defaults to "hex"'
        }
    },
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            }
        };
    }
};
