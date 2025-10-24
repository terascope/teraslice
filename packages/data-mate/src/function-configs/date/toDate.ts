import { DateFormat, FieldType } from '@terascope/types';
import { parseDateValue, toISO8601 } from '@terascope/date-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface ToDateArgs {
    format?: string | DateFormat;
}

export const toDateConfig: FieldTransformConfig<ToDateArgs> = {
    name: 'toDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a date value, specify a format to apply it to the input value',
    examples: [
        {
            args: { format: 'yyyy-MM-dd' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2019-10-22',
            output: new Date('2019-10-22T00:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 102390933,
            output: 102390933,
            serialize_output: toISO8601
        },
        {
            args: { format: DateFormat.seconds },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Long,
                    }
                }
            },
            field: 'testField',
            input: 102390933,
            output: 102390933 * 1000,
            serialize_output: toISO8601
        },
        {
            args: { format: DateFormat.milliseconds },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Long,
                    }
                }
            },
            field: 'testField',
            input: 102390933000,
            output: 102390933000,
            serialize_output: toISO8601
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2001-01-01T01:00:00.000Z',
            output: new Date('2001-01-01T01:00:00.000Z').getTime(),
            serialize_output: toISO8601,
        },
        {
            args: { format: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxxxx' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2018-01-22T18:00:00.000Z',
            output: new Date('2018-01-22T18:00:00.000Z').getTime(),
            serialize_output: toISO8601,
        },
        {
            args: { format: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXXXX' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2018-01-22T18:00:00.000Z',
            output: new Date('2018-01-22T18:00:00.000Z').getTime(),
            serialize_output: toISO8601,
        }],
    create({ args: { format } }) {
        const referenceDate = new Date();
        return function toDate(input: unknown): number {
            return parseDateValue(
                input, format, referenceDate
            );
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date
    ],
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number`
        },
    },
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Date
            },
        };
    }
};
