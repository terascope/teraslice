import { FieldType } from '@terascope/types';
import { isInteger, inNumberRange } from '@terascope/core-utils';
import { setDate, toISO8601 } from '@terascope/date-utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

export interface SetDateArgs {
    value: number;
}

export const setDateConfig: FieldTransformConfig<SetDateArgs> = {
    name: 'setDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input date with the day of the month set to the args value.',
    examples: [
        {
            args: { value: 12 },
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
            args: { value: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026000000, 420],
            output: new Date('2021-05-12T04:00:00.000Z').getTime(),
            serialize_output: toISO8601,
            test_only: true,
        },
        {
            args: { value: 22 },
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
            args: { value: 1 },
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
    create({ args: { value } }) {
        return setDate(value);
    },
    argument_schema: {
        value: {
            type: FieldType.Number,
            description: 'Value to set day of the month to, must be between 1 and 31'
        }
    },
    validate_arguments: ({ value }) => {
        if (!isInteger(value)
            || !inNumberRange(value, { min: 1, max: 31, inclusive: true })) {
            throw Error('Invalid argument "date", must be an integer between 1 and 31');
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
