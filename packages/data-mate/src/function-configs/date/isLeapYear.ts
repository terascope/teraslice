import { isLeapYear } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

export const isLeapYearConfig: FieldValidateConfig = {
    name: 'isLeapYear',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
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
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Determines if the given date is in a leap year',
    accepts: [
        FieldType.String, FieldType.Date, FieldType.Number
    ],
    create() {
        return isLeapYear;
    }
};
