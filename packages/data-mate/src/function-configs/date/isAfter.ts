import { FieldType } from '@terascope/types';
import { isAfter } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface IsAfterArgs {
    date: string | number | Date;
}

export const isAfterConfig: FieldValidateConfig<IsAfterArgs> = {
    name: 'isAfter',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Checks if the input is after the arg date',
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
        }
    ],
    argument_schema: {
        date: {
            type: FieldType.Date || FieldType.String || FieldType.Number,
            description: 'Date to compare input to'
        }
    },
    required_arguments: ['date'],
    create({ date }: IsAfterArgs) {
        return (input: unknown) => isAfter(input, date);
    },
    accepts: [FieldType.Date, FieldType.String, FieldType.Number]
};