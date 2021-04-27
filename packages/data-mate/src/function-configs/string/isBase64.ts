import { isBase64 } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a base64 string
 *
 * @example
 *
 *     isBase64('ZnJpZW5kbHlOYW1lNw==')  // true
 *     isBase64('bW9kZWxVUkwx')  // true
 *     isBase64('manufacturerUrl7')  // false
 *     isBase64('undefined')  // false
 *     isBase64(true)  // false
 *     isBase64(12345)  // false
 *     isBase64(undefined)  // false
 *     isBase64('randomstring')  // false
 *     isBase64({})
 * @param {*} input  // false
 * @returns {boolean} boolean
 *
 */

export const isBase64Config: FieldValidateConfig = {
    name: 'isBase64',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a valid base64 string',
    create() { return isBase64; },
    accepts: [],
};
