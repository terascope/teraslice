import { isAlpha, joinList, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionCategory,
    FunctionDefinitionType, FunctionDefinitionExample, AlphaLocale
} from '../interfaces';

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
        input: 'example123456',
        output: null
    },
    {
        args: { locale: 'pl-Pl' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'ThisiZĄĆĘŚŁ',
        output: 'ThisiZĄĆĘŚŁ'
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
        input: 'not_alpha.com',
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Boolean
                }
            }
        },
        field: 'testField',
        input: true,
        output: null
    }
];

export const isAlphaConfig: FieldValidateConfig<AlphaLocale> = {
    name: 'isAlpha',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a string composed of only alphabetical characters',
    create({ args: { locale } }) {
        return (input: unknown) => isAlpha(input, locale as validator.AlphaLocale);
    },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify locale to check for valid alphabetical characters, defaults to en-US if not provided'
        }
    },
    examples,
    accepts: [FieldType.String],
    required_arguments: [],
    validate_arguments({ locale }: AlphaLocale) {
        if (locale == null || (isString(locale)
            && validator.isAlphaLocales.includes(locale))) {
            return;
        }

        throw new Error(`Invalid locale, locale options are ${joinList(validator.isAlphaLocales)}`);
    }
};
