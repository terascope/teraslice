import { isEmail } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Checks if value is a valid email address
 *
 * @example
 * isEmail('email@example.com'); // true
 * isEmail('non.us.email@thing.com.uk') // true
 * isEmail('Abc@def@example.com') // true
 * isEmail('cal+henderson@iamcalx.com') // true,
 * isEmail('customer/department=shipping@example.com') //  true
 *
 * isEmail('user@blah.com/junk.junk?a=<tag value="junk"') // false
 * isEmail('Abc  @  example.com') // false
 * isEmail('bad email address') // false
 * isEmail(undefined) // false
 * isEmail(12345); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export const isEmailConfig: FieldValidateConfig = {
    name: 'isEmail',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is an email',
    create() {
        return isEmail;
    },
    accepts: [],
};
