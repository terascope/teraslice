import { FieldType } from '@terascope/types';
import {
    setMilliseconds, isInteger, inNumberRange, toISO8601
} from '@terascope/core-utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

export interface SetMillisecondsArgs {
    value: number;
}

export const setMillisecondsConfig: FieldTransformConfig<SetMillisecondsArgs> = {
    name: 'setMilliseconds',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input date with the milliseconds set to the args value.',
    examples: [
        {
            args: { value: 392 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-05-14T20:45:30.392Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { value: 483 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-05-14T20:45:30.483Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { value: 15 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026049859, -60],
            output: new Date('2021-05-14T21:00:49.015Z').getTime(),
            serialize_output: toISO8601,
            test_only: true,
        },
        {
            args: { value: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2024-05-12T00:00:00.001Z').getTime(),
            serialize_output: toISO8601
        }
    ],
    create({ args: { value } }) {
        return setMilliseconds(value);
    },
    argument_schema: {
        value: {
            type: FieldType.Number,
            description: 'Value to set milliseconds to, must be between 0 and 999'
        }
    },
    validate_arguments: ({ value }) => {
        if (!isInteger(value)
            || !inNumberRange(value, { min: 0, max: 999, inclusive: true })) {
            throw Error('Invalid argument "value", must be an integer between 0 and 999');
        }
    },
    required_arguments: ['value'],
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Date
            }
        };
    }
};
