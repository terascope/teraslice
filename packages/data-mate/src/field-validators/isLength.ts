import { FieldType } from '@terascope/types';
import { isString, isNil } from '@terascope/utils';
import validator from 'validator';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface LengthArgs {
    /** Check to see if it exactly matches size */
    size?: number;
    min?: number;
    max?: number;
}

/**
 * Check to see if input is a string with given length ranges, or a list of valid lengths
 * @example
 *      isLength('astring', { size: 7 }); // true
 *      isLength('astring', { min: 3, max: 10 }); // true
 *      isLength('astring', { size: 10 }); // false
 *      isLength('astring',  { min: 8 }); // false
 *      isLength(['astring', 'stuff', 'hi'], { min: 3 }); // true
 *
 * @param {*} input
 * @param {LengthConfig} { size, min, max }
 * @returns {boolean} boolean
 */
export const isLengthConfig: FieldValidateConfig<LengthArgs> = {
    name: 'isLength',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    description: 'Checks to see if input either matches a certain length, or is within a range',
    accepts: [],
    create(args) {
        return (input: unknown) => isLength(input, args);
    },
    argument_schema: {
        size: {
            type: FieldType.Number,
            array: false,
            description: ''
        },
        min: {
            type: FieldType.Number,
            array: false
        },
        max: {
            type: FieldType.Number,
            array: false
        }
    },
    validate_arguments({ min, max, size }) {
        if (isNil(max) && isNil(min) && isNil(size)) {
            throw new Error('Invalid arguments, must either specify "size" for exact match, or specify at least "min" or "mix" for checking a range');
        }
    }
};
// TODO: might need to change how array is handled
function isLength(
    input: unknown, { size, min = -Infinity, max = Infinity }: LengthArgs
): boolean {
    if (isNil(input)) return false;

    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }

    if (Array.isArray(input)) {
        if (size) return input.length === size;
        return input.length >= min && input.length <= max;
    }

    return false;
}
