import { FieldType } from '@terascope/types';
import { isString, isEmpty } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface EmptyArgs {
    /** Trims string input */
    readonly ignoreWhitespace?: boolean;
}

export const isEmptyConfig: FieldValidateConfig<EmptyArgs> = {
    name: 'isEmpty',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.OBJECT,
    description: 'Checks to see if input is empty',
    accepts: [],
    create({ ignoreWhitespace }) {
        return (input: unknown) => isEmptyFn(input, ignoreWhitespace);
    },
    argument_schema: {
        ignoreWhitespace: {
            type: FieldType.Boolean,
            array: false,
            description: 'If input is a string, it will attempt to trim it before validating it'
        }
    }
};

function isEmptyFn(
    input: unknown, ignoreWhitespace = false
): boolean {
    let value = input;

    if (isString(value) && ignoreWhitespace) {
        value = value.trim();
    }

    return isEmpty(value);
}
