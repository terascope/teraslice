import { FieldType } from '@terascope/types';
import {
    setDate, isInteger, inNumberRange, toISO8601
} from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig, SetDateArgs
} from '../interfaces';

export const setDateConfig: FieldTransformConfig<SetDateArgs> = {
    name: 'setDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the day of the month of the input date',
    examples: [
        {
            args: { date: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-05-12T20:45:30.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { date: 22 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-05-22T20:45:30.091Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { date: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2024-05-01T00:00:00.000Z').getTime(),
            serialize_output: toISO8601
        }
    ],
    create({ args: { date } }) {
        return setDate(date);
    },
    argument_schema: {
        date: {
            type: FieldType.Number,
            description: 'Value to set day of the month to, must be between 1 and 31'
        }
    },
    validate_arguments: ({ date }) => {
        if (!isInteger(date)
            || !inNumberRange(date, { min: 1, max: 31, inclusive: true })) {
            throw Error('Invalid argument "date", must be an integer between 1 and 31');
        }
    },
    required_arguments: ['date'],
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
