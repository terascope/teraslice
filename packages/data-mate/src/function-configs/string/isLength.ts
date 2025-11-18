import { FieldType } from '@terascope/types';
import { isString, isNil } from '@terascope/core-utils';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface IsLengthArgs {
    /** Check to see if it exactly matches size */
    readonly size?: number;
    readonly min?: number;
    readonly max?: number;
}

export const isLengthConfig: FieldValidateConfig<IsLengthArgs> = {
    name: 'isLength',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it either matches a certain length, or is within the specified range.  Otherwise returns null.',
    accepts: [FieldType.String],
    examples: [
        {
            args: { size: 8 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'iam8char',
            output: 'iam8char',
        },
        {
            args: { size: 8 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'iamnot8char',
            output: null,
        },
        {
            args: { min: 3 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'aString',
            output: 'aString',
        },
        {
            args: { min: 3, max: 5 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'aString',
            output: null,
        },
        {
            args: { min: 3, max: 5 },
            config: { version: 1, fields: { testField: { type: FieldType.Number } } },
            field: 'testField',
            input: 4,
            output: null,
        },
    ],
    create({ args }) {
        return (input: unknown) => isLength(input, args);
    },
    argument_schema: {
        size: {
            type: FieldType.Number,
            array: false,
            description: 'The value\'s length must equal this parameter if specified'
        },
        min: {
            type: FieldType.Number,
            array: false,
            description: 'The value\'s length must be greater than or equal to this parameter if specified'

        },
        max: {
            type: FieldType.Number,
            array: false,
            description: 'The value\'s length must be less than or equal to this parameter if specified'
        }
    },
    validate_arguments({ min, max, size }) {
        if (isNil(max) && isNil(min) && isNil(size)) {
            throw new Error('Invalid arguments, must either specify "size" for exact match, or specify at least "min" or "max" for checking a range');
        }
    }
};
// TODO: might need to change how array is handled
function isLength(
    input: unknown, { size, min = -Infinity, max = Infinity }: IsLengthArgs
): boolean {
    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }

    return false;
}
