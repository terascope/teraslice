import { FieldType } from '@terascope/types';
import { isInteger, inNumberRange } from '@terascope/core-utils';
import { setHours, toISO8601 } from '@terascope/date-utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

export interface SetHoursArgs {
    value: number;
}

export const setHoursConfig: FieldTransformConfig<SetHoursArgs> = {
    name: 'setHours',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input date with the hours set to the args value.',
    examples: [
        {
            args: { value: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-05-14T12:45:30.000Z').getTime(),
            serialize_output: toISO8601,
        },
        {
            args: { value: 22 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-05-14T22:45:30.091Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { value: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026000000, 120],
            output: new Date('2021-05-14T12:00:00.000Z').getTime(),
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
            output: new Date('2024-05-12T01:00:00.000Z').getTime(),
            serialize_output: toISO8601
        }
    ],
    create({ args: { value } }) {
        return setHours(value);
    },
    argument_schema: {
        value: {
            type: FieldType.Number,
            description: 'Value to set hours to, must be between 0 and 23'
        }
    },
    validate_arguments: ({ value }) => {
        if (!isInteger(value)
            || !inNumberRange(value, { min: 0, max: 23, inclusive: true })) {
            throw Error('Invalid argument "hours", must be an integer between 0 and 23');
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
