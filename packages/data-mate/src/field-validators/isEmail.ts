import { isEmail } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Return true if value is a valid email, or a list of valid emails
 *
 * @example
 * FieldValidator.isEmail('email@example.com'); // true
 * FieldValidator.isEmail('non.us.email@thing.com.uk') // true
 * FieldValidator.isEmail('Abc@def@example.com') // true
 * FieldValidator.isEmail('cal+henderson@iamcalx.com') // true,
 * FieldValidator.isEmail('customer/department=shipping@example.com') //  true
 * 
 * FieldValidator.isEmail('user@blah.com/junk.junk?a=<tag value="junk"') // false
 * FieldValidator.isEmail('Abc  @  example.com') // false
 * FieldValidator.isEmail('bad email address') // false
 * FieldValidator.isEmail(undefined) // false
 * FieldValidator.isEmail(12345); // false
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
