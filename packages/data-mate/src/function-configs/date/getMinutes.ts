import { FieldType } from '@terascope/types';
import { getMinutes } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getMinutesConfig: FieldTransformConfig = {
    name: 'getMinutes',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the minutes of the input date time',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:12:41.091Z',
            output: 12
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:59:19.091Z'),
            output: 59
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472323231,
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026300000, -418],
            output: 7,
            test_only: true,
        }
    ],
    create() {
        return getMinutes;
    },
    accepts: [
        FieldType.Date,
        FieldType.String,
        FieldType.Number
    ],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            }
        };
    }
};
