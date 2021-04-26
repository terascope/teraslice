import { isCountryCode } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a ISO 3166-1 alpha-2 country code
 *
 * @example
 *
 * isCountryCode('US')  // true
 * isCountryCode('JP')  // true
 * isCountryCode('ZM')  // true
 * isCountryCode('GB')  // true
 * isCountryCode('UK')  // false
 * isCountryCode(12345)  // false
 * isCountryCode('USA')  // false
 * isCountryCode('II')  // false
 * isCountryCode('')  // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 *
 */

export const isCountryCodeConfig: FieldValidateConfig = {
    name: 'isFQDN',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a valid ISO 3166-1 alpha-2 country code',
    create() { return isCountryCode; },
    accepts: [],
};
