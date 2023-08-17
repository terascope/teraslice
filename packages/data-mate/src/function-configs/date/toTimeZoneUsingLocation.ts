import {
    DateFormat, FieldType
} from '@terascope/types';
import { toISO8601, toTimeZoneUsingLocationFP } from '@terascope/utils';
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
            output: '2001-03-19T09:36:44.450Z',
            serialize_output: toISO8601
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
            output: '2001-03-19T09:36:44.450Z',
            serialize_output: toISO8601
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
            output: '2001-03-19T09:36:44.450Z',
            serialize_output: toISO8601
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
