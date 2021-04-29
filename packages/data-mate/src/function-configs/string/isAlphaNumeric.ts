import { isAlphaNumeric, joinList, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface AlphaNumericLocale {
    locale?: validator.AlphanumericLocale;
}

export const isAlphaNumericConfig: FieldValidateConfig = {
    name: 'isAlphaNumeric',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a string composed of only alpha-numeric characters',
    create({ locale }: AlphaNumericLocale) {
        return (input: unknown) => isAlphaNumeric(input, locale);
    },
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

        if (!isString(locale) || !('this' in validator.isAlphanumericLocales)) {
            throw new Error(`Invalid locale, locale options are ${joinList(validator.isAlphanumericLocales)}`);
        }
    }
};
