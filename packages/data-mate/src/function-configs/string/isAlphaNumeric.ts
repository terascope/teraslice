import { isAlphaNumeric, joinList, isString } from '@terascope/utils';
import { FieldType } from 'packages/types/dist/src';
import validator from 'validator';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a valid MIME Type
 *
 * @example
 *
 *  isAlphaNumeric('example')  // true
 *  isAlphaNumeric('123456')  // true
 *  isAlphaNumeric('example123456')  // true
 *  isAlphaNumeric('no_underscores.com')  // false
 *  isAlphaNumeric(true)  // false
 *  isAlphaNumeric(123456)  // false
 *  isAlphaNumeric('ThisiZĄĆĘŚŁ1234', 'pl-Pl')  // true
 *  isAlphaNumeric('ThisiZĄĆĘŚŁ1234', 'en-HK')  // false
 *     
 * @param {*} input  // false
 * @param {{ locale }} // country locale, defaults to en-US
 * @returns {boolean} boolean
 *
 */

 export interface AlphaNumericLocale {
    locale?: validator.AlphanumericLocale;
}

export const isAlphaNumericConfig: FieldValidateConfig = {
    name: 'isAlphaNumeric',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a string composed of only alpha-numeric characters',
    create({ locale }: AlphaNumericLocale ) { return (input: unknown) => isAlphaNumeric(input, locale); },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify locale to check for valid alpha-numeric characters, defaults to en-US if not provided'
        }
    },
    accepts: [FieldType.String],
    required_arguments: [],
    validate_arguments({ locale }) {
        if (locale == null) return;

        if (!isString(locale) || !locales.includes(locale)) {
            throw new Error(`Invalid locale, local options are ${joinList(locales)}`);   
        }
    }
};

const locales = [
    'ar',
    'ar-AE',
    'ar-BH',
    'ar-DZ',
    'ar-EG',
    'ar-IQ',
    'ar-JO',
    'ar-KW',
    'ar-LB',
    'ar-LY',
    'ar-MA',
    'ar-QA',
    'ar-QM',
    'ar-SA',
    'ar-SD',
    'ar-SY',
    'ar-TN',
    'ar-YE',
    'bg-BG',
    'cs-CZ',
    'da-DK',
    'de-DE',
    'el-GR',
    'en-AU',
    'en-GB',
    'en-HK',
    'en-IN',
    'en-NZ',
    'en-US',
    'en-ZA',
    'en-ZM',
    'es-ES',
    'fa-IR',
    'fr-CA',
    'fr-FR',
    'he',
    'hu-HU',
    'it-IT',
    'ku-IQ',
    'nb-NO',
    'nl-NL',
    'nn-NO',
    'pl-PL',
    'pt-BR',
    'pt-PT',
    'ru-RU',
    'sl-SI',
    'sk-SK',
    'sr-RS',
    'sr-RS@latin',
    'sv-SE',
    'tr-TR',
    'uk-UA'
];
