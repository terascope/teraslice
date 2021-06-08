import { FieldType, IsAfterArgs } from '@terascope/types';
import { isAfter, isValidDate } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isAfterConfig: FieldValidateConfig<IsAfterArgs> = {
    name: 'isAfter',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input if it is after the arg date, otherwise returns null',
    examples: [
        {
            args: { date: '2021-05-09T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: '2021-05-10T10:00:00.000Z'
        },
        {
            args: { date: 1620554400000 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: '2021-05-10T10:00:00.000Z'
        },
        {
            args: { date: '2021-05-09T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1620640800000,
            output: 1620640800000
        },
        {
            args: { date: '2021-05-10T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: null
        },
        {
            args: { date: '2021-05-10T10:00:00.000Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.DateTuple } }
            },
            field: 'testField',
            input: [1620640800000, -420],
            output: [1620640800000, -420]
        },
        {
            args: { date: [1620640800000, -420] },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: null
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
        return (input: unknown) => isAfter(input, date);
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
