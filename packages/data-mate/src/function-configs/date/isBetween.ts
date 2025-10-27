import { FieldType, DateTuple } from '@terascope/types';
import { isBetween, isValidDate } from '@terascope/core-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface IsBetweenArgs {
    start: string | number | Date | DateTuple;
    end: string | number | Date | DateTuple;
}

export const isBetweenConfig: FieldValidateConfig<IsBetweenArgs> = {
    name: 'isBetween',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input if it is between the args start and end dates, otherwise returns null',
    examples: [
        {
            args: { start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:00.001Z',
            output: '2021-05-10T10:00:00.001Z'
        },
        {
            args: { start: 1620554400000, end: 1620640800000 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1620554401000,
            output: 1620554401000
        },
        {
            args: { start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-07T10:00:00.000Z',
            output: null
        },
        {
            args: { start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-15T10:00:00.000Z',
            output: null
        },
        {
            args: { start: [1620640800000, 60], end: [1620640800000, -60] },
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
        start: {
            type: FieldType.Date,
            description: 'Start date of time range'
        },
        end: {
            type: FieldType.Date,
            description: 'End date of time range'
        }
    },
    required_arguments: ['start', 'end'],
    create({ args }) {
        return (input: unknown) => isBetween(input, args);
    },
    accepts: [
        FieldType.Date,
        FieldType.String,
        FieldType.Number
    ],
    validate_arguments(args) {
        if (!isValidDate(args.start)) {
            throw new Error(`Invalid start paramter, could not convert ${args.start} to a date`);
        }

        if (!isValidDate(args.end)) {
            throw new Error(`Invalid end paramter, could not convert ${args.end} to a date`);
        }
    }
};
