import { FieldType, TimeBetweenFormats } from '@terascope/types';
import { getTimeBetween } from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export interface GetTimeBetweenArgs {
    start?: Date | number | string;
    end?: Date | number | string;
    readonly format: TimeBetweenFormats;
}

export const getTimeBetweenConfig: FieldTransformConfig<GetTimeBetweenArgs> = {
    name: 'getTimeBetween',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns time duration between input and start or end time.  Returns the duration as a number or in the ISO 8601 duration format',
    examples: [
        {
            args: { start: '2021-05-10T10:00:00.000Z', format: 'milliseconds' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:00:01.000Z'),
            output: 1000
        },
        {
            args: { end: '2021-05-10T10:00:00.000Z', format: 'days' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: 1
        },
        {
            args: { end: 1620764441001, format: 'seconds' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1620764440001,
            output: 1
        }
    ],
    argument_schema: {
        start: {
            type: FieldType.Date || FieldType.String || FieldType.Number,
            description: 'Start time of time range, if start is after input will return a negative number'
        },
        end: {
            type: FieldType.Date || FieldType.String || FieldType.Number,
            description: 'End time of time range, if provided end is after input the return value will be negative'
        },
        format: {
            type: FieldType.String,
            description: 'The format of the return value'
        }
    },
    create(args: GetTimeBetweenArgs) {
        return (input: unknown) => getTimeBetween(input, args);
    },
    required_arguments: ['format'],
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    validate_arguments({ start, end }: GetTimeBetweenArgs) {
        if (start == null && end == null) {
            throw Error('Must provide a start or an end value');
        }
    },
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number || FieldType.String
            }
        };
    }
};
