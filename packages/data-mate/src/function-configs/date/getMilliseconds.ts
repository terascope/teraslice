import { FieldType } from '@terascope/types';
import { getMilliseconds } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getMillisecondsConfig: FieldTransformConfig = {
    name: 'getMilliseconds',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the milliseconds of the input date',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:01.091Z',
            output: 91
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:00:01.091Z'),
            output: 91
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000231,
            output: 231
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026000012, -420],
            output: 12,
            test_only: true,
        }
    ],
    create() {
        return getMilliseconds;
    },
    /**
     * `date_part('millisecond', x) % 1000`.
     *
     * **`types: [Date]` is required, not defensive.** These functions accept `Date`, `String` AND
     * `Number`, and for the latter two the UDF PARSES the value - many formats, `Number` as epoch
     * millis - which this expression does not do. So the emission claims only a real TIMESTAMP column
     * and a `String` or `Number` column keeps using the UDF.
     *
     * **The stored value is a naive UTC TIMESTAMP, and these getters are UTC-based.** Verified under
     * `TZ=America/New_York`: `getHours('2026-01-02T03:04:05.678Z')` is `3`, the UTC hour, not `22` - so
     * `date_part` on the stored timestamp is the same thing, with no timezone handling needed.
     *
     * **The `% 1000` is load-bearing:** DuckDB's `millisecond` part includes the SECONDS -
     * `5678` for `:05.678` - where `getMilliseconds` returns just `678`.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `date_part('millisecond', ${value}) % 1000`,
    },
    accepts: [
        FieldType.Date,
        FieldType.String,
        FieldType.Number
    ],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            }
        };
    }
};
