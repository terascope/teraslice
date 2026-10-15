import { FieldType } from '@terascope/types';
import { getSeconds } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getSecondsConfig: FieldTransformConfig = {
    name: 'getSeconds',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the seconds of the input date',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:00:41.091Z',
            output: 41
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:00:19.091Z'),
            output: 19
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472323231,
            output: 23
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026002000, -420],
            output: 2,
            test_only: true,
        }
    ],
    create() {
        return getSeconds;
    },
    /**
     * Runs as `date_part('second', x)`.
     *
     * Only a `Date` column is handled. The function also accepts `String` and `Number` input,
     * which the UDF parses first, so those columns keep the UDF.
     *
     * The column stores a UTC timestamp and the function returns the UTC part, so no timezone
     * handling is needed.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `date_part('second', ${value})`,
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
