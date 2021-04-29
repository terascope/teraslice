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
    create({ locale }: PostalCodeLocale) {
        return (input: unknown) => isPostalCode(input, locale);
    },
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

        if (!isString(locale) || !(locale in validator.isPostalCodeLocales)) {
            throw new Error(`Invalid locale, locale options are ${joinList(validator.isPostalCodeLocales)}`);
        }
    }
};
