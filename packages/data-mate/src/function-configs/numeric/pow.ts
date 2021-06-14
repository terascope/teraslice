import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';
import { runMathFn } from './utils';

export interface PowerArgs {
    readonly value: number;
}

export const powConfig: FieldTransformConfig<PowerArgs> = {
    name: 'pow',
    aliases: ['power'],
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns a number representing the input value taken to the power of the value',
    examples: [
        {
            args: { value: 3 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 7,
            output: 343
        },
        {
            args: { value: 0.5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 4,
            output: 2
        }
    ],
    create({ args: { value } }) {
        // eslint-disable-next-line no-restricted-properties
        return runMathFn(Math.pow, value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
            array: false,
            description: 'The exponent used to raise the base'
        },
    },
    required_arguments: ['value'],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            }
        };
    }
};
