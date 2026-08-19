import { isLeapYear } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isLeapYearConfig: FieldValidateConfig = {
    name: 'isLeapYear',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2020-05-10T10:00:00.000Z',
            output: '2020-05-10T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [1589104800000, 60],
            output: '2020-05-10T11:00:00.000+01:00'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the the input if it is in a leap year, otherwise returns null',
    /**
     * The Gregorian rule spelled out, because DuckDB has no `isleapyear`.
     *
     * Divisible by 4, except centuries, except every 400 years. Exact integer arithmetic on the year
     * part, so there is nothing to approximate.
     *
     * `types: [Date]` because this also accepts `String` and `Number`, which the UDF parses.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => {
            const year = `date_part('year', ${value})`;
            return `(mod(${year}, 4) = 0 AND (mod(${year}, 100) != 0 OR mod(${year}, 400) = 0))`;
        },
    },
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isLeapYear;
    }
};
