import {
    DateFormat, FieldType
} from '@terascope/types';
import { toTimeZoneUsingLocationFP } from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const toTimeZoneUsingLocationConfig: FieldTransformConfig = {
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
            output: '2001-03-19 11:36:44+01:00',
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
            output: '2001-03-19 11:36:44+01:00',
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
            output: '2001-03-19 11:36:44+01:00',
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
            output: '2023-08-22 08:41:50-07:00'
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
            output: '2023-08-22 11:41:50-04:00',
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
            output: '2023-11-22 10:41:50-05:00',
        },
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
                type: FieldType.Any
            },
        };
    }
};
