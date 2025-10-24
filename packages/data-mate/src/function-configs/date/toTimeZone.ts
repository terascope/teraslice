import { DateFormat, FieldType } from '@terascope/types';
import { toTimeZone } from '@terascope/date-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface TimeZoneArgs {
    timezone: string;
}

export const toTimeZoneConfig: FieldTransformConfig<TimeZoneArgs> = {
    name: 'toTimeZone',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to local time',
    examples: [
        {
            args: { timezone: 'Africa/Ndjamena' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2001-03-19T10:36:44.450Z',
            output: '2001-03-19T11:36:44.450+01:00',
        },
        {
            args: { timezone: 'Africa/Ndjamena' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: new Date('2001-03-19T10:36:44.450Z'),
            output: '2001-03-19T11:36:44.450+01:00',
        },
        {
            args: { timezone: 'America/Phoenix' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-08-22T15:41:50.172Z',
            output: '2023-08-22T08:41:50.172-07:00',
        },
        {
            args: { timezone: 'America/New_York' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-08-22T15:41:50.172Z',
            output: '2023-08-22T11:41:50.172-04:00',
        },
        {
            args: { timezone: 'America/New_York' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-11-22T15:41:50.172Z',
            output: '2023-11-22T10:41:50.172-05:00',
        },
        {
            args: { timezone: 'America/Phoenix' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-11-22T15:41:50.172Z',
            output: '2023-11-22T08:41:50.172-07:00',
        },
        {
            args: { timezone: 'Asia/Calcutta' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-11-22T15:41:50.172Z',
            output: '2023-11-22T21:11:50.172+05:30',
        },
    ],
    create({ args: { timezone } }) {
        return (val) => toTimeZone(val, timezone);
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date,
    ],
    argument_schema: {
        timezone: {
            type: FieldType.String,
            description: 'The timezone that the date will be shown in'
        }
    },
    required_arguments: ['timezone'],
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
