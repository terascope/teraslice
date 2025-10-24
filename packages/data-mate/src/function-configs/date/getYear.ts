import { FieldType } from '@terascope/types';
import { getYear } from '@terascope/date-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const getYearConfig: FieldTransformConfig = {
    name: 'getYear',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the year of the input date time',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-11T10:12:41.091Z',
            output: 2021
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-16T10:59:19.091Z'),
            output: 2021
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '05/22/2021 EST',
            output: 2021
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1510123223231,
            output: 2017
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026300000, -420],
            output: 2021,
            test_only: true,
        }
    ],
    create() {
        return getYear;
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
