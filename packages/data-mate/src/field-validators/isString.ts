import { isString } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that input is a string
 *
 * @example
 * isString('this is a string'); // true
 * isString('12345'); // true
 * isString(true); // false
 * isString(['hello', 'world']); // false
 * isString({ hello: 'there' }); // false
 * isString(12345); // false
 * isString(undefined); // false
 * isString(null); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export const isStringConfig: FieldValidateConfig = {
    name: 'isString',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a string',
    create() {
        return isString;
    },
    accepts: [],
};
