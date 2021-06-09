import { isYesterday, subtractFromDate } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

const date = new Date();
const currentTime = date.toISOString();
const yesterday = subtractFromDate(currentTime, { days: 1 });
const yesterdayDate = new Date(yesterday).toISOString();

export const isYesterdayConfig: FieldValidateConfig = {
    name: 'isYesterday',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
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
            config: { version: 1, fields: { testField: { type: FieldType.DateTuple } } },
            field: 'testField',
            input: [new Date(yesterdayDate).getTime(), 60],
            output: [new Date(yesterdayDate).getTime(), 60]
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
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number,
        FieldType.DateTuple
    ],
    create() {
        return isYesterday;
    }
};
