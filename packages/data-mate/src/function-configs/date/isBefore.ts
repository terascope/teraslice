import { FieldType, DateTuple } from '@terascope/types';
import { isBefore, isValidDate } from '@terascope/date-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface IsBeforeArgs {
    date: string | number | Date | DateTuple;
}

export const isBeforeConfig: FieldValidateConfig<IsBeforeArgs> = {
    name: 'isBefore',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
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
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1620640800000, 0],
            output: null,
            test_only: true,
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
        FieldType.Number
    ],
    validate_arguments(args) {
        if (!isValidDate(args.date)) {
            throw new Error(`Invalid date paramter, could not convert ${args.date} to a date`);
        }
    }
};
