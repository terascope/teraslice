import { FieldType } from '@terascope/types';
import { getTimeBetween } from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export interface GetTimeBetweenArgs {
    start?: Date | number | string;
    end?: Date | number | string;
    format: TimeBetweenFormats;
}

export type TimeBetweenFormats = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'calendarDays' | 'businessDays' | 'weeks' | 'calendarWeeks' | 'months' | 'calendarMonths' | 'quarters' | 'calendarQuarters' | 'years' | 'calendarYears' | 'calendarISOWeekYears' | 'isoWeekYears' | 'isoDuration';

export const getTimeBetweenConfig: FieldTransformConfig = {
    name: 'getTimeBetween',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns time duration between input and start or end time.  Returns the duration as a number or in the ISO 8601 duration format',
    examples: [
        {
            args: { start: '2021-05-10T10:00:0.000Z', format: 'millisecond' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:01.000Z',
            output: 1000
        },
        {
            args: { end: '2021-05-10T10:00:00.000Z', format: 'days'},
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
            output: 1000
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
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    validate_arguments({ start, end, format }: GetTimeBetweenArgs) {
        if (start == null && end == null) {
            throw Error('Must provide a start or an end value');
        }
    }
};
