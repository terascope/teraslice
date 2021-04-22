import { isSame } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates input equals the value
 *
 * @example
 * contains('hello', 'hello') // true
 * contains('hello', 'foo') // false
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
            description: 'any value'
        }
    }
};
