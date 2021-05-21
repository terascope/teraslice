import { FieldType } from '@terascope/types';
import {
    setSeconds, isInteger, inNumberRange, toISO8061
} from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const setSecondsConfig: FieldTransformConfig<{ seconds: number }> = {
    name: 'setSeconds',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the seconds of the input date',
    examples: [
        {
            args: { seconds: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-05-14T20:45:12.000Z').getTime(),
            serialize_output: toISO8061
        },
        {
            args: { seconds: 22 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-05-14T20:45:22.091Z').getTime(),
            serialize_output: toISO8061
        },
        {
            args: { seconds: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2024-05-12T00:00:01.000Z').getTime(),
            serialize_output: toISO8061
        }
    ],
    create({ args: { seconds } }) {
        return setSeconds(seconds);
    },
    argument_schema: {
        seconds: {
            type: FieldType.Number,
            description: 'Value to set seconds to, must be between 0 and 59'
        }
    },
    validate_arguments: ({ seconds }) => {
        if (!isInteger(seconds)
            || !inNumberRange(seconds, { min: 0, max: 59, inclusive: true })) {
            throw Error('Invalid arguments "seconds", must be an integer between 0 and 59');
        }
    },
    required_arguments: ['seconds'],
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
