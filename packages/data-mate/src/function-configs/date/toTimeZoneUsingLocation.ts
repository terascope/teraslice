import { DateFormat, FieldType, GeoInput } from '@terascope/types';
import { toTimeZone } from '@terascope/core-utils';
import { lookupTimezone } from '@terascope/geo-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface TimeZoneUsingLocationArgs {
    location: GeoInput;
}

function toTimeZoneUsingLocationFP(location: unknown) {
    // location validation happens inside lookupTimezone
    const timezone = lookupTimezone(location);

    return function _toTimeZoneUsingLocation(val: unknown) {
        return toTimeZone(val, timezone);
    };
}

export const toTimeZoneUsingLocationConfig: FieldTransformConfig<TimeZoneUsingLocationArgs> = {
    name: 'toTimeZoneUsingLocation',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to local time',
    examples: [
        {
            args: {
                location: {
                    lat: 16.8277,
                    lon: 21.24046,
                }
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2001-03-19T10:36:44.450Z',
            output: '2001-03-19T11:36:44.450+01:00',
        },
        {
            args: {
                location: '16.8277,21.24046',
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2001-03-19T10:36:44.450Z',
            output: '2001-03-19T11:36:44.450+01:00',
        },
        {
            args: {
                location: [21.24046, 16.8277],
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2001-03-19T10:36:44.450Z',
            output: '2001-03-19T11:36:44.450+01:00',
        },
        {
            args: {
                location: { lat: 33.4192222, lon: -111.6566588 }
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-08-22T15:41:50.172Z',
            output: '2023-08-22T08:41:50.172-07:00'
        },
        {
            args: {
                location: { lat: 40.776936, lon: -73.911140 }
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-08-22T15:41:50.172Z',
            output: '2023-08-22T11:41:50.172-04:00',
        },
        {
            args: {
                location: { lat: 40.776936, lon: -73.911140 }
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2023-11-22T15:41:50.172Z',
            output: '2023-11-22T10:41:50.172-05:00',
        },
        {
            args: {
                location: { lat: 31.636133, lon: -106.428667 }
            },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2020-01-03T19:41:00.000Z',
            output: '2020-01-03T12:41:00.000-07:00',
        }
    ],
    create({ args: { location } }) {
        return toTimeZoneUsingLocationFP(location);
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date,
    ],
    argument_schema: {
        location: {
            type: FieldType.Any,
            description: 'The geo-point used to determine the timezone'
        }
    },
    required_arguments: ['location'],
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                description: field_config.description,
                array: field_config.array,
                type: FieldType.Date
            },
        };
    }
};
