import { isBoolean } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';
/**
 * Checks to see if input is a boolean.
 *
 * @example
 *      const isBoolean = isBooleanConfig.create();
 *
 *      isBoolean(true) ===  true
 *      isBoolean(false) ===  true
 *      isBoolean('true') ===  false
 *      isBoolean(1) ===  false
 *      isBoolean([1, 2, 3]) ===  false
 *      isBoolean(null) ===  false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export const isBooleanConfig: FieldValidateConfig = {
    name: 'isBoolean',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a boolean',
    create() {
        return isBoolean;
    },
    accepts: [],
};
