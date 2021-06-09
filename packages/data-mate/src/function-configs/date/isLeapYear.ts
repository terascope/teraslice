import { isLeapYear } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

export const isLeapYearConfig: FieldValidateConfig = {
    name: 'isLeapYear',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
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
            config: { version: 1, fields: { testField: { type: FieldType.DateTuple } } },
            field: 'testField',
            input: [1589104800000, 60],
            output: [1589104800000, 60]
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
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number,
        FieldType.DateTuple
    ],
    create() {
        return isLeapYear;
    }
};
