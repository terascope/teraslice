import { isPostalCode, joinList, isString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample,
} from '../interfaces.js';

export interface IsPostalCodeArgs {
    locale?: validator.PostalCodeLocale;
}

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: '85249',
        output: '85249'
    },
    {
        args: { locale: 'RU' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: '191123',
        output: '191123'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'bobsyouruncle',
        output: null
    },
    {
        args: { locale: 'CN' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'this is not a postal code',
        output: null
    }
];

export const isPostalCodeConfig: FieldValidateConfig<IsPostalCodeArgs> = {
    name: 'isPostalCode',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a valid postal code, otherwise returns null.',
    examples,
    create({ args: { locale } }) {
        return (input: unknown) => isPostalCode(input, locale as validator.PostalCodeLocale);
    },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify the locale to check for valid postal codes in specific regions, defaults to any if locale is not provided'
        }
    },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
    required_arguments: [],
    validate_arguments({ locale }: IsPostalCodeArgs) {
        if (locale == null || (isString(locale)
            && validator.isPostalCodeLocales.includes(locale))) {
            return;
        }

        throw new Error(`Invalid locale, locale options are ${joinList(validator.isPostalCodeLocales)}`);
    }
};
