import { isTomorrow, addToDate } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

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
    ],
    description: 'Returns the input if it is on the next day (utc-time), otherwise returns null',
    accepts: [
        FieldType.String, FieldType.Date, FieldType.Number
    ],
    create() {
        return isTomorrow;
    }
};
