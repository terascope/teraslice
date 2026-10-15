import { FieldType } from '@terascope/types';
import { getUTCMonth } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getUTCMonthConfig: FieldTransformConfig = {
    name: 'getUTCMonth',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the month of the input date in UTC Time',
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
        return getUTCMonth;
    },
    /**
     * Runs as `date_part('month', x)`.
     *
     * Only a `Date` column is handled. The function also accepts `String` and `Number` input,
     * which the UDF parses first, so those columns keep the UDF.
     *
     * The column stores a UTC timestamp and the function returns the UTC part, so no timezone
     * handling is needed.
     *
     * Both sides are 1-based, as in `getMonth`.
    */
    sql: {
        types: [FieldType.Date],
        // use the instant: core-utils' `getUTCMonth` ignores a DateTuple's offset
        expression: ({ value, instant }) => `date_part('month', ${instant ?? value})`,
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
