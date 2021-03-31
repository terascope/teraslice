import { isString } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that input is a string
 *
 * @example
 * FieldValidator.isString('this is a string'); // true
 * FieldValidator.isString('12345'); // true
 * FieldValidator.isString(true); // false
 * FieldValidator.isString(['hello', 'world']); // false
 * FieldValidator.isString({ hello: 'there' }); // false
 * FieldValidator.isString(12345); // false
 * FieldValidator.isString(undefined); // false
 * FieldValidator.isString(null); // false
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
