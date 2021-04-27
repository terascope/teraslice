import { isFQDN } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a UUID
 *
 * @example
 *
 * isFQDN('example.com') // true
 * isFQDN('international-example.com.br') // true
 * isFQDN('some.other.domain.uk') // true
 * isFQDN('1234.com') // true
 * isFQDN('no_underscores.com') // false
 * isFQDN(12345) // false
 * isFQDN(undefined) // false
 * isFQDN('**.bad.domain.com') // false
 * isFQDN('example.0') // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 *
 */

export const isFQDNConfig: FieldValidateConfig = {
    name: 'isFQDN',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a fully qualified domain name',
    create() { return isFQDN; },
    accepts: [],
};
