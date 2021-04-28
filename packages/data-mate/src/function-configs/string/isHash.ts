import { FieldType } from '@terascope/types';
import { isString, joinList } from '@terascope/utils';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export type HashConfigAlgorithms =
 | 'md4'
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

export interface IsHashArgs {
    algo: string;
}

export const isHashConfig: FieldValidateConfig<IsHashArgs> = {
    name: 'isHash',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a hash',
    create({ algo }: IsHashArgs) {
        return (input: unknown) => isString(input) && validator.isHash(
            input, algo as validator.HashAlgorithm
        );
    },
    accepts: [FieldType.String],
    argument_schema: {
        algo: {
            type: FieldType.String,
            array: false,
            description: 'Which algorithm to check values against'
        }
    },
    required_arguments: ['algo'],
    validate_arguments({ algo }) {
        if (!listOfAlgorithms.includes(algo)) {
            throw new Error(`Invalid algorithm ${algo}, must be set to one of ${joinList(listOfAlgorithms)}`);
        }
    }
};
