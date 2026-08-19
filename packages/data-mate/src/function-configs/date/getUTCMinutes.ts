import { FieldType } from '@terascope/types';
import { getUTCMinutes } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getUTCMinutesConfig: FieldTransformConfig = {
    name: 'getUTCMinutes',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the minutes of the input date in UTC time',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:12:41.091Z',
            output: 12
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:59:19.091Z'),
            output: 59
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472323231,
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026300000, -418],
            output: 5,
            test_only: true,
        }
    ],
    create() {
        return getUTCMinutes;
    },
    /**
     * `date_part('minute', x)`.
     *
     * **`types: [Date]` is required, not defensive.** These functions accept `Date`, `String` AND
     * `Number`, and for the latter two the UDF PARSES the value - many formats, `Number` as epoch
     * millis - which this expression does not do. So the emission claims only a real TIMESTAMP column
     * and a `String` or `Number` column keeps using the UDF.
     *
     * **The stored value is a naive UTC TIMESTAMP, and these getters are UTC-based.** Verified under
     * `TZ=America/New_York`: `getHours('2026-01-02T03:04:05.678Z')` is `3`, the UTC hour, not `22` - so
     * `date_part` on the stored timestamp is the same thing, with no timezone handling needed.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `date_part('minute', ${value})`,
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
