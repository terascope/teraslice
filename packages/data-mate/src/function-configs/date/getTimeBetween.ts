import { FieldType } from '@terascope/types';
import {
    getTimeBetween,
    GetTimeBetweenArgs,
    getDurationFunc,
    joinList
} from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const getTimeBetweenConfig: FieldTransformConfig<GetTimeBetweenArgs> = {
    name: 'getTimeBetween',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns time duration as a number or ISO 8601 duration format between the input and start or end arg.',
    examples: [
        {
            args: { start: '2021-05-10T10:00:00.000Z', interval: 'milliseconds' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:00:01.000Z'),
            output: 1000
        },
        {
            args: { end: '2021-05-10T10:00:00.000Z', interval: 'days' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: 1
        },
        {
            args: { end: 1620764441001, interval: 'seconds' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1620764440001,
            output: 1
        },
        {
            args: { end: '2023-01-09T18:19:23.132Z', interval: 'ISO8601' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: 'P1Y7M30DT8H19M23S'
        }
    ],
    argument_schema: {
        start: {
            type: FieldType.Date,
            description: 'Start time of time range, if start is after the input it will return a negative number'
        },
        end: {
            type: FieldType.Date,
            description: 'End time of time range, if end is before the input it will return a negative number'
        },
        interval: {
            type: FieldType.String,
            description: `The interval of the return value.  Accepts ${joinList(Object.keys(getDurationFunc))} or use ISO8601 to get the return value in ISO-8601 duration format, see https://www.digi.com/resources/documentation/digidocs/90001437-13/reference/r_iso_8601_duration_format.htm`
        }
    },
    create({ args }) {
        return (input: unknown) => getTimeBetween(input, args);
    },
    required_arguments: ['interval'],
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    validate_arguments({ start, end }: GetTimeBetweenArgs) {
        if ((start == null && end == null) || (start != null && end != null)) {
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
