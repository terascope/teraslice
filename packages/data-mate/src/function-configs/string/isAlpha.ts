import { isAlpha, joinList, isString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionCategory,
    FunctionDefinitionType, FunctionDefinitionExample
} from '../interfaces.js';

export interface IsAlphaArgs {
    locale?: validator.AlphaLocale;
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

export const isAlphaConfig: FieldValidateConfig<IsAlphaArgs> = {
    name: 'isAlpha',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a string composed of only alphabetical characters, otherwise returns null.',
    create({ args: { locale } }) {
        return (input: unknown) => isAlpha(input, locale as validator.AlphaLocale);
    },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify the locale to check for valid alphabetical characters, defaults to en-US if not provided'
        }
    },
    examples,
    accepts: [FieldType.String],
    required_arguments: [],
    validate_arguments({ locale }: IsAlphaArgs) {
        if (locale == null || (isString(locale)
            && validator.isAlphaLocales.includes(locale))) {
            return;
        }

        throw new Error(`Invalid locale, locale options are ${joinList(validator.isAlphaLocales)}`);
    }
};
