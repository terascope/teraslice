import { contains } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates if substring is in a string
 * item and substring must be strings
 *
 * @example
 * contains('hello', 'll') // true
 * contains('hello', 'foo') // false
 *
 * @param {*} input
 * @param {{ substr: string }} { substr }
 * @returns {boolean} boolean
 */

export interface IncludesArgs {
    substr: string;
}

export const containsConfig: FieldValidateConfig<IncludesArgs> = {
    name: 'includes',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if string contains substring',
    create({ substr }) {
        return (input: unknown) => contains(input, substr);
    },
    accepts: [],
    argument_schema: {
        substr: {
            type: FieldType.String,
            array: false,
            description: 'substr should be a string'
        }
    }
};
