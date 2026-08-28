import { isPast } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { beforeNow } from './sql-utils.js';

export const isPastConfig: FieldValidateConfig = {
    name: 'isPast',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2021-05-10T10:00:00.000Z',
            output: '2021-05-10T10:00:00.000Z'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: [1620640800000, 60],
            output: '2021-05-10T11:00:00.000+01:00',
            test_only: true,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2121-05-09T10:00:00.000Z',
            output: null
        },
    ],
    description: 'Returns the input if it is in the past, otherwise returns null',
    /**
     * Strictly before the plan-time instant.
     *
     * **"now" is resolved ONCE, at plan time**, where the UDF reads it per row - the accepted
     * behaviour change recorded in `sql-utils.ts`.
    */
    sql: {
        types: [FieldType.Date],
        expression: ({ value }) => beforeNow(value),
    },
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    create() {
        return isPast;
    }
};
