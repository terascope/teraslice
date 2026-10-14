import { isTomorrow, addToDate } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { onLocalDay } from './sql-utils.js';

const date = new Date();
const currentTime = date.toISOString();
const tomorrow = addToDate(currentTime, { days: 1 });
const tomorrowDate = new Date(tomorrow).toISOString();

export const isTomorrowConfig: FieldValidateConfig = {
    name: 'isTomorrow',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: currentTime,
            output: null,
            description: 'represents current time'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: tomorrowDate,
            output: tomorrowDate,
            description: 'represents day after current time'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [new Date(tomorrow).getTime(), 0],
            output: tomorrowDate,
            test_only: true
        },
    ],
    description: 'Returns the input if it is on the next day (utc-time), otherwise returns null',
    /**
     * True when the date falls on tomorrow in the local timezone.
     *
     * "Now" is read once when the query is planned, not per row as the UDF does; see
     * `sql-utils.ts`.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => onLocalDay(value, 1),
    },
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isTomorrow;
    }
};
