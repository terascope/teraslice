import { FieldType } from '@terascope/types';
import { setMinutes, isInteger, inNumberRange } from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const setMinutesConfig: FieldTransformConfig<{ minutes: number }> = {
    name: 'setMinutes',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the seconds of the input date',
    examples: [
        {
            args: { minutes: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-05-14T20:12:30.000Z').getTime()
        },
        {
            args: { minutes: 22 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-05-14T20:22:30.091Z').getTime()
        },
        {
            args: { minutes: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2024-05-12T00:01:00.000Z').getTime()
        }
    ],
    create({ minutes }: { minutes: number }) {
        return (input: unknown) => setMinutes(input, minutes);
    },
    argument_schema: {
        minutes: {
            type: FieldType.Number,
            description: 'Value to set minutes to, must be between 0 and 59'
        }
    },
    validate_arguments: ({ minutes }: { minutes: number}) => {
        if (!isInteger(minutes)
            || !inNumberRange(minutes, { min: 0, max: 59, inclusive: true })) {
            throw Error('minutes value must be an integer between 0 and 59');
        }
    },
    required_arguments: ['minutes'],
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            }
        };
    }
};
