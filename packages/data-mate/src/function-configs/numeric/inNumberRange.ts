import { inNumberRangeFP } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    InNumberRangeArg
} from '../interfaces';

export const inNumberRangeConfig: FieldValidateConfig<InNumberRangeArg> = {
    name: 'inNumberRange',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Checks if a number is within a given min and max value, optionally inclusive or exclusive',
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
            description: 'The maximum value allowed in the range, defaults to Negative Infinity'
        },
        max: {
            type: FieldType.Number,
            array: false,
            description: 'The minimum value allowed in the range, defaults to Positive Infinity'
        },
        inclusive: {
            type: FieldType.Boolean,
            array: false,
            description: 'Whether not the min and max values should be included in the range'
        }
    },
};
