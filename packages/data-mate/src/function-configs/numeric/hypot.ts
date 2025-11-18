import { FieldType } from '@terascope/types';
import {
    toFloatOrThrow
} from '@terascope/core-utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const hypotConfig: FieldTransformConfig = {
    name: 'hypot',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the square root of the sum of squares of the given arguments. If at least one of the arguments cannot be converted to a number, null is returned',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [3, 4],
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [5, 12],
            output: 13
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [3, 4, null, 5],
            output: 7.0710678118654755
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: null,
            output: null
        }
    ],
    create() {
        return function _hypot(input): number | null {
            if (input == null) return null;

            const numbers = getNumericValues(input);

            const value = Math.hypot(...numbers);
            if (value === Number.NEGATIVE_INFINITY
                || value === Number.POSITIVE_INFINITY
                || Number.isNaN(value)) {
                return null;
            }
            return value;
        };
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                array: false,
                type: FieldType.Float
            }
        };
    }
};

function getNumericValues(input: unknown): number[] {
    if (input == null) return [];
    if (Array.isArray(input)) {
        let numbers: number[] = [];
        for (const value of input) {
            numbers = numbers.concat(getNumericValues(value));
        }
        return numbers;
    }
    return [toFloatOrThrow(input)];
}
