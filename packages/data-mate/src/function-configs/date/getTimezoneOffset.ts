import { FieldType } from '@terascope/types';
import { getTimezoneOffsetFP } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { timezoneOffsetMinutes } from './sql-utils.js';

export interface GetTimezoneOffsetArgs {
    timezone: string;
}

export const getTimezoneOffsetConfig: FieldTransformConfig<GetTimezoneOffsetArgs> = {
    name: 'getTimezoneOffset',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: `Given a date and timezone, it will return the offset from UTC in minutes.
     This is more accurate than timezoneToOffset as it can better account for daylight saving time`,
    examples: [
        {
            args: { timezone: 'Africa/Accra' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-20T15:13:52.131Z'),
            output: 0,
        },
        {
            args: { timezone: 'America/Anchorage' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-20T15:13:52.131Z'),
            output: -8 * 60,
        },
        {
            args: { timezone: 'America/Aruba' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-20T15:13:52.131Z'),
            output: -4 * 60,
        },
        {
            args: { timezone: 'Asia/Istanbul' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-20T15:13:52.131Z'),
            output: 3 * 60,
        },
        {
            args: { timezone: 'Australia/Canberra' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-20T15:13:52.131Z'),
            output: 10 * 60,
        },

    ],
    create({ args: { timezone } }) {
        return getTimezoneOffsetFP(timezone);
    },
    /**
     * The DST-aware per-row offset, via `AT TIME ZONE` in both directions.
     *
     * The zone is a constant argument here, so nothing needs the column - but the INSTANT does,
     * which is why this is not a constant: `America/New_York` is -300 in January and -240 in July,
     * and the emission gets both right.
    */
    sql: {
        types: [FieldType.Date],
        applies: (args) => typeof args.timezone === 'string',
        expression: ({ value, args }) => timezoneOffsetMinutes(value, args.timezone as string),
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date
    ],
    argument_schema: {
        timezone: {
            type: FieldType.String,
            description: 'Must be a valid IANA time zone name'
        },
    },
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Short
            },
        };
    },
    required_arguments: ['timezone']
};
