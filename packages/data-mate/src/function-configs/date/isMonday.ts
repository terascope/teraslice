import { isMonday } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isMondayConfig: FieldValidateConfig = {
    name: 'isMonday',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: '2021-05-10T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [1620640800000, 60],
            output: '2021-05-10T11:00:00.000+01:00',
            test_only: true,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the the input if it is on a Monday',
    /**
     * Runs as `dayofweek(x) = 1`.
     *
     * DuckDB's `dayofweek` numbers Sunday as 0, the same as JavaScript's `getUTCDay`.
     *
     * Only a `Date` column is handled; `String` and `Number` input is parsed by the UDF.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `dayofweek(${value}) = 1`,
    },
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isMonday;
    }
};
