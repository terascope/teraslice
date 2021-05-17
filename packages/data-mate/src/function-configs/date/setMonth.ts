import { FieldType } from '@terascope/types';
import { setMonth, isInteger, inNumberRange } from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const setMonthConfig: FieldTransformConfig<{ month: number }> = {
    name: 'setMonth',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Set the seconds of the input month',
    examples: [
        {
            args: { month: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2021-12-14T20:45:39.000Z')
        },
        {
            args: { month: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('2021-02-14T20:45:30.091Z')
        },
        {
            args: { month: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2024-01-12T00:00:00.000Z')
        }
    ],
    create({ month }: { month: number }) {
        return (input: unknown) => setMonth(input, month);
    },
    argument_schema: {
        month: {
            type: FieldType.Number,
            description: 'Value to set month to, must be between 0 and 23'
        }
    },
    validate_arguments: ({ month }: { month: number}) => {
        if (!isInteger(month)
            || !inNumberRange(month, { min: 1, max: 12, inclusive: true })) {
            throw Error('month value must be an integer between 1 and 12');
        }
    },
    required_arguments: ['month'],
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Date
            }
        };
    }
};
