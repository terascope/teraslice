import { isUrl } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a url
 *
 * @example
 * isURL('http://example.com'); // true
 * isURL('http://example.com/hello%20world'); // true
 * isURL('https://someurl.cc.ru.ch'); // true
 * isURL('ftp://someurl.bom:8080?some=bar&hi=bob'); // true
 * isURL('http://xn--fsqu00a.xn--3lr804guic'); // true
 * isURL('htp://example.com'); // false
 * isURL('http://mal formed url.com'); // true
 * isURL('BAD-URL'); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export const isUrlConfig: FieldValidateConfig = {
    name: 'isUrl',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a string',
    create() { return isUrl; },
    accepts: [],
};
