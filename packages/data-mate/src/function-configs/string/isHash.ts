import { FieldType } from '@terascope/types';
import { isString, joinList } from '@terascope/core-utils';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface IsHashArgs {
    algo: string;
}

export type HashConfigAlgorithms
    = 'md4'
        | 'md5'
        | 'sha1'
        | 'sha256'
        | 'sha384'
        | 'sha512'
        | 'ripemd128'
        | 'ripemd160'
        | 'tiger128'
        | 'tiger160'
        | 'tiger192'
        | 'crc32'
        | 'crc32b';

const listOfAlgorithms = [
    'md4',
    'md5',
    'sha1',
    'sha256',
    'sha384',
    'sha512',
    'ripemd128',
    'ripemd160',
    'tiger128',
    'tiger160',
    'tiger192',
    'crc32',
    'crc32b'
];

export const isHashConfig: FieldValidateConfig<IsHashArgs> = {
    name: 'isHash',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a hashed value, otherwise returns null.',
    examples: [
        {
            args: { algo: 'sha256' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
            output: '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
        },
        {
            args: { algo: 'md5' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
            output: null
        }
    ],
    create({ args: { algo } }) {
        return (input: unknown) => isString(input) && validator.isHash(
            input, algo as validator.HashAlgorithm
        );
    },
    accepts: [FieldType.String],
    argument_schema: {
        algo: {
            type: FieldType.String,
            array: false,
            description: 'The hashing algorithm to check values against'
        }
    },
    required_arguments: ['algo'],
    validate_arguments({ algo }) {
        if (!listOfAlgorithms.includes(algo)) {
            throw new Error(`Invalid algorithm ${algo}, must be set to one of ${joinList(listOfAlgorithms)}`);
        }
    }
};
