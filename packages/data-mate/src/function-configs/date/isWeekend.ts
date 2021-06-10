import { isWeekend } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldValidateConfig
} from '../interfaces';

export const isWeekendConfig: FieldValidateConfig = {
    name: 'isWeekend',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-12T10:00:00.000Z',
            output: null
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-13T10:00:00.000Z',
            output: null
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [new Date('2021-05-09T10:00:00.000Z').getTime(), 60],
            output: '2021-05-09T10:00:00.000+01:00'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: '2021-05-09T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-08T10:00:00.000Z',
            output: '2021-05-08T10:00:00.000Z'
        },
    ],
    description: 'Returns the input if it is on a Weekend (Saturday-Sunday), otherwise returns null',
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isWeekend;
    }
};
