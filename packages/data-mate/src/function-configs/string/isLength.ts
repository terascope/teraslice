import { FieldType } from '@terascope/types';
import { isString, isNil } from '@terascope/utils';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface LengthArgs {
    /** Check to see if it exactly matches size */
    size?: number;
    min?: number;
    max?: number;
}

export const isLengthConfig: FieldValidateConfig<LengthArgs> = {
    name: 'isLength',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.STRING,
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
