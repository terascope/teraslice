import { isTomorrow, addToDate } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

const date = new Date();
const currentTime = date.toISOString();
const tomorrow = Date.now();
const tomorrowDate = new Date(Date.now()).toISOString();

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
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isTomorrow;
    }
};
