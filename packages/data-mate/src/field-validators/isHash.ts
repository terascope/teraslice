import { FieldType } from '@terascope/types';
import { isString, joinList } from '@terascope/utils';
import validator from 'validator';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

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

/**
 * Checks to see if input is a hash.
 *
 * @example
 *      const isSHA256 = isHashConfig.create({ algo:'sha256' });
 *
 *      isSHA256('85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33') ===  true
 *      isSHA256('98fc121ea4c749f2b06e4a768b92ef1c740625a0') ===  false
 *      isSHA256('6201b3d1815444c87e00963fcf008c1e') ===  false
 *      isSHA256(null) ===  false
 *      isSHA256(23532) ===  false
 *
 * @param string input
 * @returns {boolean} boolean
 */

export const isHashConfig: FieldValidateConfig<IsHashArgs> = {
    name: 'isHash',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
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
