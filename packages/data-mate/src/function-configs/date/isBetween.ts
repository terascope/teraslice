import { FieldType } from '@terascope/types';
import { isBetween, isValidDate } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface IsBetweenArgs {
    start: string | number | Date;
    end: string | number | Date;
}

export const isBetweenConfig: FieldValidateConfig<IsBetweenArgs> = {
    name: 'isBetween',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Checks if the input is before the arg date',
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
        }
    ],
    argument_schema: {
        start: {
            type: FieldType.Date || FieldType.String || FieldType.Number,
            description: 'Start date of time range'
        },
        end: {
            type: FieldType.Date || FieldType.String || FieldType.Number,
            description: 'End date of time range'
        }
    },
    required_arguments: ['start', 'end'],
    create({ args }) {
        return (input: unknown) => isBetween(input, args);
    },
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    validate_arguments(args) {
        if (!isValidDate(args.start)) {
            throw new Error(`Invalid start paramter, could not convert ${args.start} to a date`);
        }

        if (!isValidDate(args.end)) {
            throw new Error(`Invalid end paramter, could not convert ${args.end} to a date`);
        }
    }
};
