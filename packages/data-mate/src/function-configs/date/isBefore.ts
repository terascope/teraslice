import { FieldType, IsBeforeArgs } from '@terascope/types';
import { isBefore, isValidDate } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isBeforeConfig: FieldValidateConfig<IsBeforeArgs> = {
    name: 'isBefore',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input if it is before the arg date, otherwise returns null',
    examples: [
        {
            args: { date: '2021-05-10T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: '2021-05-09T10:00:00.000Z'
        },
        {
            args: { date: '2021-05-10T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1620554400000,
            output: 1620554400000
        },
        {
            args: { date: 1620640800000 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: '2021-05-09T10:00:00.000Z'
        },
        {
            args: { date: '2021-05-10T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-11T10:00:00.000Z',
            output: null
        },
        {
            args: { date: [1620640800000, -120] },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.DateTuple } }
            },
            field: 'testField',
            input: [1620640800000, 0],
            output: [1620640800000, 0]
        }
    ],
    argument_schema: {
        date: {
            type: FieldType.Date,
            description: 'Date to compare input to'
        }
    },
    required_arguments: ['date'],
    create({ args: { date } }) {
        return (input: unknown) => isBefore(input, date);
    },
    accepts: [
        FieldType.Date,
        FieldType.String,
        FieldType.Number,
        FieldType.DateTuple
    ],
    validate_arguments(args) {
        if (!isValidDate(args.date)) {
            throw new Error(`Invalid date paramter, could not convert ${args.date} to a date`);
        }
    }
};
