import {
    DateFormat, FieldType
} from '@terascope/types';
import { toTimeZone } from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const toTimeZoneConfig: FieldTransformConfig = {
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
            output: '2001-03-19 11:36:44+01:00',
        },
        {
            args: { timezone: 'Africa/Ndjamena' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: new Date('2001-03-19T10:36:44.450Z'),
            output: '2001-03-19 11:36:44+01:00',
        },
        {
            args: { timezone: 'America/Phoenix' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-08-22T15:41:50.172Z',
            output: '2023-08-22 08:41:50-07:00',
        },
        {
            args: { timezone: 'America/New_York' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-08-22T15:41:50.172Z',
            output: '2023-08-22 11:41:50-04:00',
        },
        {
            args: { timezone: 'America/New_York' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-11-22T15:41:50.172Z',
            output: '2023-11-22 10:41:50-05:00',
        },
        {
            args: { timezone: 'America/Phoenix' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-11-22T15:41:50.172Z',
            output: '2023-11-22 08:41:50-07:00',
        },
    ],
    create({ args: { timezone } }) {
        return (val) => toTimeZone(val, timezone as any);
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
                type: FieldType.String
            },
        };
    }
};
