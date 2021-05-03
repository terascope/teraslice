import { isPostalCode, joinList, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces';

export interface PostalCodeLocale {
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
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Number
                }
            }
        },
        field: 'testField',
        input: 85249,
        output: 85249
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

export const isPostalCodeConfig: FieldValidateConfig = {
    name: 'isPostalCode',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid postal code',
    examples,
    create({ locale }: PostalCodeLocale) {
        return (input: unknown) => isPostalCode(input, locale);
    },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify locale to check for postal code, defaults to any if locale is not provided'
        }
    },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
    required_arguments: [],
    validate_arguments({ locale }) {
        if (locale == null || (isString(locale) && locale in validator.isPostalCodeLocales)) {
            return;
        }

        throw new Error(`Invalid locale, locale options are ${joinList(validator.isPostalCodeLocales)}`);
    }
};
