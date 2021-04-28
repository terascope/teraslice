import { FieldType } from '@terascope/types';
import { isString, isEmpty } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface EmptyArgs {
    /** Trims string input */
    ignoreWhitespace?: boolean;
}
/**
 * Validates that the input is empty
 * @example
 * isEmpty(''); // true
 * isEmpty(undefined); // true
 * isEmpty(null); // true
 * isEmpty({ foo: 'bar' }); // false
 * isEmpty({}); // true
 * isEmpty([]); // true
 * isEmpty('     ', {}, { ignoreWhitespace: true }); // true
 *
 * @param {*} input
 * @param {{ ignoreWhitespace: boolean }} [args] set to true if you want the value to be trimmed
 * @returns {boolean} boolean
 */

export const isEmptyConfig: FieldValidateConfig<EmptyArgs> = {
    name: 'isEmpty',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
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
