import { isBoolean } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';
/**
 * Checks to see if input is a boolean.
 * If given an array, will check if all values are booleans
 *
 * @example
 * FieldValidator.isBoolean(false); // true
 * FieldValidator.isBoolean('astring'); // false
 * FieldValidator.isBoolean(0); // false
 * FieldValidator.isBoolean([true, undefined]); // true
 * FieldValidator.isBoolean(['true', undefined]; // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export const isBooleanConfig: FieldValidateConfig = {
    name: 'isBoolean',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a boolean. If given an array, will check if all values are booleans',
    create() {
        return isBoolean;
    },
    accepts: [],
};
