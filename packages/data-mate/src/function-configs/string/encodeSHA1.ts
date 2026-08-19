import { BinaryToTextEncoding } from 'node:crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { cryptoEncode } from './encode-utils.js';

export interface EncodeSHA1Args {
    digest?: BinaryToTextEncoding;
}

const defaultDigest: BinaryToTextEncoding = 'hex';

export const encodeSHA1Config: FieldTransformConfig<EncodeSHA1Args> = {
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
    /**
     * `sha1`, but only for a HEX digest - which is the default.
     *
     * DuckDB's `sha1` returns lower-case hex, matching `crypto`'s `digest('hex')`. A base64 digest has
     * no native form, so `applies` returns false for it and that call keeps using the UDF.
    */
    sql: {
        applies: (args) => (args.digest ?? 'hex') === 'hex',
        expression: ({ value }) => `sha1(${value})`,
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
