import { inNumberRangeFP, InNumberRangeArg } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export type { InNumberRangeArg };

export const inNumberRangeConfig: FieldValidateConfig<InNumberRangeArg> = {
    name: 'inNumberRange',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the input if it is within the given min and max values, arg option for inclusive or exclusive',
    examples: [
        {
            args: { min: 100, max: 110 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
            output: null
        },
        {
            args: { min: 100 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 100,
            output: null
        },
        {
            args: { min: 100, inclusive: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 100,
            output: 100
        },
        {
            args: { min: 0, max: 100 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 10,
            output: 10
        },
        {
            args: { min: 100, inclusive: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: Number.POSITIVE_INFINITY,
            output: Number.POSITIVE_INFINITY
        },
        {
            args: { min: 100, inclusive: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: Number.NEGATIVE_INFINITY,
            output: null
        }
    ],
    create({ args }) {
        return inNumberRangeFP(args);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        min: {
            type: FieldType.Number,
            array: false,
            description: 'The minimum value allowed in the range, defaults to Negative Infinity'
        },
        max: {
            type: FieldType.Number,
            array: false,
            description: 'The maximum value allowed in the range, defaults to Positive Infinity'
        },
        inclusive: {
            type: FieldType.Boolean,
            array: false,
            description: 'Whether not the min and max values should be included in the range'
        }
    },
};
