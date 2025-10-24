import { isFriday } from '@terascope/date-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isFridayConfig: FieldValidateConfig = {
    name: 'isFriday',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-14T10:00:00.000Z',
            output: '2021-05-14T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [1620986400000, -620],
            output: null
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [1620936000000, 120], // '2021-05-14T01:00:00.000+02:00'
            output: null,
            test_only: true
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-09T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the given date if it is on a Friday, otherwise returns null',
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isFriday;
    }
};
