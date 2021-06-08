import { FieldType } from '@terascope/types';
import { getHours } from '@terascope/utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const getHoursConfig: FieldTransformConfig = {
    name: 'getHours',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the hours of the input date in UTC Time',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-10T10:12:41.091Z',
            output: 10
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-10T10:59:19.091Z'),
            output: 10
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '05/22/2021 EST',
            output: 5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 17154123223231,
            output: 2
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.DateTuple } }
            },
            field: 'testField',
            input: [1621026300000, -420],
            output: 4
        }
    ],
    create() {
        return getHours;
    },
    accepts: [
        FieldType.Date,
        FieldType.String,
        FieldType.Number,
        FieldType.DateTuple
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
