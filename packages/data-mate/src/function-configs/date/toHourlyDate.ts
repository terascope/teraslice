import { DateFormat, FieldType, ISO8601DateSegment } from '@terascope/types';
import { toISO8601, trimISODateSegment } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const toHourlyDateConfig: FieldTransformConfig = {
    name: 'toHourlyDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a hourly ISO 8601 date segment',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2019-10-22T01:05:20.000Z',
            output: new Date('2019-10-22T01:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: [new Date('2019-10-22T01:05:20.000Z').getTime(), -120],
            output: new Date('2019-10-21T23:00:00.000Z').getTime(),
            serialize_output: toISO8601,
            test_only: true,
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2018-01-22T18:00:00.000Z',
            output: new Date('2018-01-22T18:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2018-01-22T18:20:00.000Z',
            output: new Date('2018-01-22T18:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
    ],
    create() {
        return trimISODateSegment(ISO8601DateSegment.hourly);
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date
    ],
    argument_schema: {},
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
