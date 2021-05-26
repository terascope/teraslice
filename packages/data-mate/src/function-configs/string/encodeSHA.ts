import { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';
import { cryptoEncode } from './encode-utils';

export interface EncodeSHAConfig {
    hash?: string;
    digest?: BinaryToTextEncoding;
}

const hashDefault = 'sha256';
const digestDefault: BinaryToTextEncoding = 'hex';

export const encodeSHAConfig: FieldTransformConfig<EncodeSHAConfig> = {
    name: 'encodeSHA',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a SHA encoded version of the input string',
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
            output: 'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5',
            description: 'hashing algorithm defaults to sha256, and digest defaults to hex'
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
            output: '5D5pi47iDwmuQlfoHXyKxQdM3aKorvjWwA275bQE9+U=',
        }
    ],
    create({ args: { hash = hashDefault, digest = digestDefault } }) {
        return cryptoEncode(hash, digest);
    },
    accepts: [FieldType.String],
    argument_schema: {
        hash: {
            type: FieldType.String,
            array: false,
            description: 'Which hashing algorithm to use, defaults to sha256'
        },
        digest: {
            type: FieldType.String,
            array: false,
            description: 'Which hash digest to use, may be set to either "base64" or "hex", defaults to "hex"'
        }
    },
    validate_arguments({ hash }) {
        if (hash == null) return;
        if (!hash.startsWith('sha')) {
            throw new TypeError(`Invalid hash argument "${hash}" given to encodeSHA, must be a valid sha algorithm`);
        }
    },
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
