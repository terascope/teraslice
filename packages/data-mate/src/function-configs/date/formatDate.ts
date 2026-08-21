import { DateFormat, FieldType } from '@terascope/types';
import {
    formatDateValue, getValidDateWithTimezoneOrThrow
} from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export interface FormatDateArgs {
    format?: string | DateFormat;
}

export const formatDateConfig: FieldTransformConfig<FormatDateArgs> = {
    name: 'formatDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a date value to a formatted date string.  Can specify the format with args to format the output value',
    examples: [{
        args: { format: 'yyyy-MM-dd' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2019-10-22T00:00:00.000Z',
        output: '2019-10-22',
    },
    {
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: 102390933,
        output: '1970-01-02T04:26:30.933Z'
    },
    {
        args: { format: DateFormat.milliseconds },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Date,
                }
            }
        },
        field: 'testField',
        input: '1973-03-31T01:55:33.000Z',
        output: 102390933000,
    },
    {
        args: { format: DateFormat.iso_8601 },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Date,
                }
            }
        },
        field: 'testField',
        input: [1622760480654, 60],
        output: '2021-06-03T23:48:00.654Z',
        test_only: true,
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2001-01-01T01:00:00.000Z',
        output: '2001-01-01T01:00:00.000Z'
    },
    {
        args: { format: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXXXX' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2018-01-22T18:00:00.000Z',
        output: '2018-01-22T18:00:00.000Z',
    }],
    create({ args: { format } }) {
        return function formatDate(input: unknown): string | number {
            return formatDateValue(
                getValidDateWithTimezoneOrThrow(input), format
            );
        };
    },
    sql: {
        /**
         * **Three of `formatDateValue`'s four branches are one function call**, which is what the
         * "translating the date-fns format vocabulary is its own project" note was hiding:
         *
         * | `format` | what it returns | emission |
         * |---|---|---|
         * | `epoch_millis`, `milliseconds` | the millis | `epoch_ms(v)` |
         * | `epoch`, `seconds` | `floor(ms / 1000)` | `floor(epoch_ms(v) / 1000)` |
         * | absent, or `iso_8601` | `toISO8601(value)` | `strftime(v, '%Y-%m-%dT%H:%M:%S.%gZ')` |
         * | anything else | `formatDate(ms + offset, format)` | **declined** - date-fns |
         *
         * Verified exact on four instants including 1900 and the epoch itself. `output_type`
         * already declares Number for the epoch formats and String otherwise, so the emission's
         * types line up with the column without any extra work.
         *
         * `types: [Date]` for the same reason as every other date function: `String` and `Number`
         * columns make the UDF PARSE the value first.
        */
        types: [FieldType.Date],
        applies: ({ format }) => format == null || format in DateFormat,
        expression: ({ value, args: { format } }) => {
            if (format === DateFormat.epoch_millis
                || format === DateFormat.milliseconds) {
                return `epoch_ms(${value})`;
            }
            if (format === DateFormat.epoch || format === DateFormat.seconds) {
                return `CAST(floor(epoch_ms(${value}) / 1000) AS BIGINT)`;
            }
            return `strftime(${value}, '%Y-%m-%dT%H:%M:%S.%gZ')`;
        },
    },
    accepts: [
        FieldType.Date,
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for numbers`
        },
    },
    output_type(inputConfig, { format }) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: isNumberOutput(format) ? FieldType.Number : FieldType.String
            },
        };
    }
};

function isNumberOutput(format: DateFormat | string | undefined) {
    if (format === DateFormat.epoch || format === DateFormat.epoch_millis) return true;
    if (format === DateFormat.seconds || format === DateFormat.milliseconds) return true;
    return false;
}
