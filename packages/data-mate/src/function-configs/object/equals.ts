import { isSame } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates input equals the value
 *
 * @example
 *
 * equals('thisisastring', 'thisisastring') // true
 * equals(['an', 'array', 'of', 'values'], ['an', 'array', 'of', 'values']) // true
 * equals({ foo: 'bar' }, { foo: 'bar' }) // true
 * equals(
 *      { foo: 'bar', deep: { value: 'kitty' } }, { foo: 'bar', deep: { value: 'kitty' } }
 *   ) // true
 * equals(true, true) //, true
 * equals(undefined, undefined) //, true
 * equals(12345, 12345) //, true
 * equals('thisisastring', 'somethingelse') // false
 * equals(1234, 12345) //, false
 * equals(false, true) //, false
 * equals(null, undefined) //, false
 * equals({ foo: 'bar'}, { foo: 'bin' }) // false
 * equals({ deep: { value: 'kitty' } }, { deep: { value: 'lion' } }) // false
 * equals([ 1, 2, 3, 4], [1, 2, 3] ) // false
 *
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean} boolean
 */

export interface IncludesArgs {
    value: any;
}

export const equalsConfig: FieldValidateConfig<IncludesArgs> = {
    name: 'equals',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input matches the value',
    create({ value }) {
        return (input: unknown) => isSame(input, value);
    },
    accepts: [],
    argument_schema: {
        value: {
            type: FieldType.Any,
            array: false,
            description: 'Value to use in the comparison'
        }
    }
};
