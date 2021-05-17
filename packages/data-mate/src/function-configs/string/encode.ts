import { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';
import { encodeAny } from './encode-utils';

export interface EncodeConfig {
    algo: string;
    digest?: BinaryToTextEncoding;
}

export const encodeConfig: FieldTransformConfig<EncodeConfig> = {
    name: 'encode',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a value to a hash using a specified algorithm',
    examples: [
        {
            args: { algo: 'sha256' },
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
            description: 'Hashing algorithm defaults to 256, and digest defaults to hex'
        },
        {
            args: { algo: 'md5' },
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
            output: '7e33b72a611da99c7e9013dd44dbbdad',
        },
        {
            args: { algo: 'url' },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String
                    }
                }
            },
            field: 'testField',
            input: 'google.com?q=HELLO AND GOODBYE',
            output: 'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
        },
        {
            args: { algo: 'base64' },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String
                    }
                }
            },
            field: 'testField',
            input: 'HELLO AND GOODBYE',
            output: 'SEVMTE8gQU5EIEdPT0RCWUU='
        },
        {
            args: { algo: 'sha1', digest: 'base64' },
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
            output: '6MsUBHluumd5onY3fM6ZpQKjZIE=',
        }
    ],
    create({ algo, digest }) {
        return encodeAny(algo, digest);
    },
    accepts: [FieldType.String],
    argument_schema: {
        algo: {
            type: FieldType.String,
            array: false,
            description: 'Which has hashing algorithm to use'
        },
        digest: {
            type: FieldType.String,
            array: false,
            description: 'Which has digest to use, may be set to either "base64" or "hex", defaults to "hex". '
            + 'Only used when algorithm is not base64, hex, or url'
        }
    },
    required_arguments: ['algo'],
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
