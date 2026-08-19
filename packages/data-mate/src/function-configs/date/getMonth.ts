import { FieldType } from '@terascope/types';
import { getMonth } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getMonthConfig: FieldTransformConfig = {
    name: 'getMonth',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the month of the input date time',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-11T10:12:41.091Z',
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-16T10:59:19.091Z'),
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '05/22/2021 EST',
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1510123223231,
            output: 11
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026300000, -420],
            output: 5,
            test_only: true,
        }
    ],
    create() {
        return getMonth;
    },
    /**
     * `date_part('month', x)`.
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
     * **1-based, and so is `getMonth`** - it returns `1` for January where JavaScript's own
     * `Date.getMonth` returns `0`. Verified against the implementation; `date_part` agrees.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `date_part('month', ${value})`,
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
