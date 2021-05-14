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
            input: yesterdayDate,
            output: yesterdayDate,
            description: 'represents day before current time'
        },
    ],
    description: 'Determines if the given date is on the day before (utc-time)',
    accepts: [
        FieldType.String, FieldType.Date, FieldType.Number
    ],
    create() {
        return isYesterday;
    }
};
