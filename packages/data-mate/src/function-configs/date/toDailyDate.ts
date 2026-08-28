import {
    DateFormat, FieldType, ISO8601DateSegment
} from '@terascope/types';
import { toISO8601, trimISODateSegment } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const toDailyDateConfig: FieldTransformConfig = {
    name: 'toDailyDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a daily ISO 8601 date segment',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2019-10-22T01:00:00.000Z',
            output: new Date('2019-10-22T00:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: '2018-01-22T18:00:00.000Z',
            output: new Date('2018-01-22T00:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
            },
            field: 'testField',
            input: [1571706000000, 60],
            output: new Date('2019-10-22T00:00:00.000Z').getTime(),
            serialize_output: toISO8601
        }
    ],
    create() {
        return trimISODateSegment(ISO8601DateSegment.daily);
    },
    /**
     * `date_trunc('day', x)`.
     *
     * Truncation is in UTC on both sides - verified that `toDailyDate` on
     * `2026-01-02T03:04:05.678Z` gives `2026-01-02T00:00:00Z` even under `TZ=America/New_York`.
     *
     * `types: [Date]` because these also accept `String` and `Number`, which the UDF parses and this
     * expression does not - see any of the `get*` emissions for the full reasoning.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `date_trunc('day', ${value})`,
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
