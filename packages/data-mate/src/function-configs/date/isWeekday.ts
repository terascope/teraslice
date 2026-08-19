import { isWeekday } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isWeekdayConfig: FieldValidateConfig = {
    name: 'isWeekday',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-12T10:00:00.000Z',
            output: '2021-05-12T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-13T10:00:00.000Z',
            output: '2021-05-13T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [new Date('2021-05-13T10:00:00.000Z').getTime(), 60],
            output: '2021-05-13T11:00:00.000+01:00',
            test_only: true
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: null
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-08T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the input if it is on a Weekday (Monday-Friday), otherwise returns null',
    /**
     * `dayofweek(x) BETWEEN 1 AND 5` - Monday to Friday.
     *
     * `types: [Date]` because this also accepts `String` and `Number`, which the UDF parses.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => `dayofweek(${value}) BETWEEN 1 AND 5`,
    },
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isWeekday;
    }
};
