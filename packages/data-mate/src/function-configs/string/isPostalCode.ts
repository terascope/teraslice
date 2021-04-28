import { isPostalCode, joinList, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

 export interface PostalCodeLocale {
    locale?: validator.PostalCodeLocale;
}

export const isPostalCodeConfig: FieldValidateConfig = {
    name: 'isPostalCode',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a valid postal code',
    create({ locale }: PostalCodeLocale ) { return (input: unknown) => isPostalCode(input, locale); },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify locale to check for postal code, defaults to any if locale is not provided'
        }
    },
    accepts: [FieldType.String],
    required_arguments: [],
    validate_arguments({ locale }) {
        if (locale == null) return;

        if (!isString(locale) || !locales.includes(locale)) {
            throw new Error(`Invalid locale, locale options are ${joinList(locales)}`);   
        }
    }
};

const locales = [
        'AD',
        'AT',
        'AU',
        'AZ',
        'BE',
        'BG',
        'BR',
        'BY',
        'CA',
        'CH',
        'CN',
        'CZ',
        'DE',
        'DK',
        'DO',
        'DZ',
        'EE',
        'ES',
        'FI',
        'FR',
        'GB',
        'GR',
        'HR',
        'HT',
        'HU',
        'ID',
        'IE',
        'IL',
        'IN',
        'IR',
        'IS',
        'IT',
        'JP',
        'KE',
        'KR',
        'LI',
        'LT',
        'LU',
        'LV',
        'MT',
        'MX',
        'MY',
        'NL',
        'NO',
        'NP',
        'NZ',
        'PL',
        'PR',
        'PT',
        'RO',
        'RU',
        'SA',
        'SE',
        'SG',
        'SI',
        'TH',
        'TN',
        'TW',
        'UA',
        'US',
        'ZA',
        'ZM'
    ];
