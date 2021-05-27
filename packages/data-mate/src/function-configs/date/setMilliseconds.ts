import { FieldType } from '@terascope/types';
import {
    setMilliseconds, isInteger, inNumberRange, toISO8601
} from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig, SetMillisecondsArgs
} from '../interfaces';

export const setMillisecondsConfig: FieldTransformConfig<SetMillisecondsArgs> = {
    name: 'setMilliseconds',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the milliseconds of the input date',
    examples: [
        {
            args: { milliseconds: 392 },
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
            args: { milliseconds: 483 },
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
            args: { milliseconds: 1 },
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
    create({ args: { milliseconds } }) {
        return setMilliseconds(milliseconds);
    },
    argument_schema: {
        milliseconds: {
            type: FieldType.Number,
            description: 'Value to set milliseconds to, must be between 0 and 999'
        }
    },
    validate_arguments: ({ milliseconds }) => {
        if (!isInteger(milliseconds)
            || !inNumberRange(milliseconds, { min: 0, max: 999, inclusive: true })) {
            throw Error('Invalid argument "milliseconds", must be an integer between 0 and 999');
        }
    },
    required_arguments: ['milliseconds'],
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Date
            }
        };
    }
};
