import { FieldType } from '@terascope/types';
import { setYear, isInteger } from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const setYearConfig: FieldTransformConfig<{ year: number }> = {
    name: 'setYear',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the year of the input date',
    examples: [
        {
            args: { year: 2024 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2024-05-14T20:45:30.000Z').getTime(),
        },
        {
            args: { year: 1984 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('1984-05-14T20:45:30.091Z').getTime(),
        },
        {
            args: { year: 2001 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2001-05-12T00:00:00.000Z').getTime(),
        }
    ],
    create({ year }: { year: number }) {
        return (input: unknown) => setYear(input, year);
    },
    argument_schema: {
        year: {
            type: FieldType.Number,
            description: 'Value to set year to, must be an integer'
        }
    },
    validate_arguments: ({ year }) => {
        if (!isInteger(year)) {
            throw Error('Invalid argument "year", must be an integer');
        }
    },
    required_arguments: ['year'],
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            },
        };
    }
};
