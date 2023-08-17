import {
    DateFormat, FieldType
} from '@terascope/types';
import { toISO8601, toTimeZone } from '@terascope/utils';
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
            output: new Date('2001-03-19T09:36:44.450Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { timezone: 'Africa/Ndjamena' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: new Date('2001-03-19T10:36:44.450Z'),
            output: new Date('2001-03-19T09:36:44.450Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { timezone: 'Africa/Ndjamena' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: new Date('2001-03-19T10:36:44.450Z').getTime(),
            output: new Date('2001-03-19T09:36:44.450Z').getTime(),
            serialize_output: toISO8601
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
