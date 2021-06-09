import { isThursday } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

export const isThursdayConfig: FieldValidateConfig = {
    name: 'isThursday',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-13T10:00:00.000Z',
            output: '2021-05-13T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.DateTuple } } },
            field: 'testField',
            input: [new Date('2021-05-13T10:00:00.000Z').getTime(), 60],
            output: [new Date('2021-05-13T10:00:00.000Z').getTime(), 60]
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the input if it is on a Thursday, otherwise returns null',
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number,
        FieldType.DateTuple
    ],
    create() {
        return isThursday;
    }
};
