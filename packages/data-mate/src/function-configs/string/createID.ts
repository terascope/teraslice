import { FieldType } from '@terascope/types';
import { toString } from '@terascope/core-utils';
import { BinaryToTextEncoding } from 'node:crypto';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { encodeAny } from './encode-utils.js';

export interface CreateIDArgs {
    hash?: string;
    digest?: BinaryToTextEncoding;
}

const hashDefault = 'md5';
const digestDefault: BinaryToTextEncoding = 'hex';

export const createIDConfig: FieldTransformConfig<CreateIDArgs> = {
    name: 'createID',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a hash encoded string from one or more values. You can optionally override the default hash encoding of "md5"',
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
            input: 'foo',
            output: 'acbd18db4cc2f85cedef654fccc4a4d8',
            description: 'hashing algorithm defaults to md5'
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String,
                        array: true
                    }
                }
            },
            field: 'testField',
            input: ['foo1', 'bar1'],
            output: 'ad3ffa6c042cdee09c226a0544215f6f',
        },
        {
            args: { hash: 'sha256' },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String,
                        array: true
                    }
                }
            },
            field: 'testField',
            input: ['foo1', 'bar1'],
            output: '62910cf6a9d2b270a7f51cc7fc30efe274c0cdf2c04f18ac0757843b1c4dade2',
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String,
                        array: true
                    }
                }
            },
            field: 'testField',
            input: ['foo2', 'bar2'],
            test_only: true,
            output: 'a6fa48b01386292677e78e02d1be0104',
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Tuple,
                    },
                    'testField.0': {
                        type: FieldType.String,
                    },
                    'testField.1': {
                        type: FieldType.Number,
                    }
                }
            },
            field: 'testField',
            input: ['foo1', 1],
            test_only: true,
            output: '0cab903e4f6c48b6bc500a45ee161a37',
        }
    ],
    create({ args: { hash = hashDefault, digest = digestDefault } }) {
        const encode = encodeAny(hash, digest);
        return function _createID(value) {
            if (value == null) return;
            if (Array.isArray(value)) {
                return encode(value.flat().map(toString)
                    .join(''));
            }
            return encode(toString(value));
        };
    },
    accepts: [],
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
    },
    output_type(): DataTypeFieldAndChildren {
        return {
            field_config: {
                type: FieldType.Keyword
            },
            child_config: undefined
        };
    }
};
