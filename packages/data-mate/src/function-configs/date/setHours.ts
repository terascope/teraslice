import { FieldType } from '@terascope/types';
import {
    setHours, isInteger, inNumberRange, toISO8061
} from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const setHoursConfig: FieldTransformConfig<{ hours: number }> = {
    name: 'setHours',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the hours of the input date',
    examples: [
        {
            args: { hours: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-05-14T12:45:30.000Z').getTime(),
            serialize_output: toISO8061
        },
        {
            args: { hours: 22 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-05-14T22:45:30.091Z').getTime(),
            serialize_output: toISO8061
        },
        {
            args: { hours: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2024-05-12T01:00:00.000Z').getTime(),
            serialize_output: toISO8061
        }
    ],
    create({ args: { hours } }) {
        return setHours(hours);
    },
    argument_schema: {
        hours: {
            type: FieldType.Number,
            description: 'Value to set hours to, must be between 0 and 23'
        }
    },
    validate_arguments: ({ hours }) => {
        if (!isInteger(hours)
            || !inNumberRange(hours, { min: 0, max: 23, inclusive: true })) {
            throw Error('Invalid argument "hours", must be an integer between 0 and 23');
        }
    },
    required_arguments: ['hours'],
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
