import { isToday } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

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
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [new Date(date).getTime(), 0],
            output: date,
            test_only: true
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [new Date(date).getTime(), 1440],
            output: null,
            test_only: true
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2020-05-09T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the input if it is on the same day (utc-time), otherwise returns null',
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isToday;
    }
};
