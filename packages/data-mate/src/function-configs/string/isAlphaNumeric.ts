import { isAlphaNumeric, joinList, isString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionCategory,
    FunctionDefinitionType, FunctionDefinitionExample
} from '../interfaces.js';

export interface IsAlphaNumericArgs {
    locale?: validator.AlphanumericLocale;
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
        output: 'example123456'
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
        input: 'ThisiZĄĆĘŚŁ1234',
        output: 'ThisiZĄĆĘŚŁ1234'
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
        input: 'not_alphanumeric.com',
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

export const isAlphaNumericConfig: FieldValidateConfig<IsAlphaNumericArgs> = {
    name: 'isAlphaNumeric',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a string composed of only alpha-numeric characters, otherwise returns null.',
    create({ args: { locale } }) {
        return (input: unknown) => isAlphaNumeric(input, locale as validator.AlphanumericLocale);
    },
    argument_schema: {
        locale: {
            type: FieldType.String,
            description: 'Specify locale to check for valid alpha-numeric characters, defaults to en-US if not provided'
        }
    },
    examples,
    accepts: [FieldType.String],
    required_arguments: [],
    validate_arguments({ locale }: IsAlphaNumericArgs) {
        if (locale == null || (isString(locale)
            && validator.isAlphanumericLocales.includes(locale))) {
            return;
        }

        throw new Error(`Invalid locale, locale options are ${joinList(validator.isAlphanumericLocales)}`);
    }
};
