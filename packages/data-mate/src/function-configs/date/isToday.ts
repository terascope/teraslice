import { isToday } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

const date = new Date().toISOString();

export const isTodayConfig: FieldValidateConfig = {
    name: 'isToday',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: date,
            output: date,
            description: 'this input is created at execution time'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2020-05-09T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Determines if the given date is on the same day (utc-time)',
    accepts: [
        FieldType.String, FieldType.Date, FieldType.Number
    ],
    create() {
        return isToday;
    }
};