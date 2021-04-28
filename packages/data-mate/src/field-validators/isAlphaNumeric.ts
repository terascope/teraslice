import { isAlphaNumeric } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a valid MIME Type
 *
 * @example
 *
 *  isMimeType('application/javascript') // true
 *  isMimeType('application/graphql') // true
 *  isMimeType('text/html') // true
 *  isMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') // true
 *  isMimeType('application') // false
 *  isMimeType('') // false
 *  isMimeType(12345) // false
 *     
 * @param {*} input  // false
 * @returns {boolean} boolean
 *
 */

export const isAlphaNumericConfig: FieldValidateConfig = {
    name: 'isAlphaNumeric',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a string composed of only alpha-numeric characters',
    create() { return isAlphaNumeric; },
    accepts: [],
};
