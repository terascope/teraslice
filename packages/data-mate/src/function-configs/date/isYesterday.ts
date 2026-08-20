import { isYesterday, subtractFromDate, toISO8601 } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { onLocalDay } from './sql-utils.js';

const date = new Date();
const currentTime = date.toISOString();
const yesterday = subtractFromDate(currentTime, { days: 1 });
const yesterdayDate = new Date(yesterday).toISOString();

export const isYesterdayConfig: FieldValidateConfig = {
    name: 'isYesterday',
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
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [new Date(yesterdayDate).getTime(), 0],
            output: new Date(yesterdayDate).getTime(),
            serialize_output: toISO8601,
            test_only: true,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: yesterdayDate,
            output: yesterdayDate,
            description: 'represents day before current time'
        },
    ],
    description: 'Returns the input if it is on the day before (utc-time), otherwise returns null',
    /**
     * Within yesterday's local day.
     *
     * **"now" is resolved ONCE, at plan time**, where the UDF reads it per row - the accepted
     * behaviour change recorded in `sql-utils.ts`.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => onLocalDay(value, -1),
    },
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isYesterday;
    }
};
