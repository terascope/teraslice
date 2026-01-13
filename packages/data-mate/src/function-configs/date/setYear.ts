import { FieldType } from '@terascope/types';
import { isInteger, setYear, toISO8601 } from '@terascope/core-utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

export interface SetYearArgs {
    value: number;
}

export const setYearConfig: FieldTransformConfig<SetYearArgs> = {
    name: 'setYear',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input date with the year set to the args value.',
    examples: [
        {
            args: { value: 2024 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: new Date('2024-05-14T20:45:30.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { value: 1984 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: new Date('2021-05-14T20:45:30.091Z'),
            output: new Date('1984-05-14T20:45:30.091Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { value: 2023 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: [1621026000000, 420],
            output: new Date('2023-05-15T04:00:00.000Z').getTime(),
            serialize_output: toISO8601
        },
        {
            args: { value: 2001 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1715472000000,
            output: new Date('2001-05-12T00:00:00.000Z').getTime(),
            serialize_output: toISO8601
        }
    ],
    create({ args: { value } }) {
        return setYear(value);
    },
    argument_schema: {
        value: {
            type: FieldType.Number,
            description: 'Value to set year to, must be an integer'
        }
    },
    validate_arguments: ({ value }) => {
        if (!isInteger(value)) {
            throw Error('Invalid argument "value", must be an integer');
        }
    },
    required_arguments: ['value'],
    accepts: [
        FieldType.String,
        FieldType.Date,
        FieldType.Number
    ],
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Date
            },
        };
    }
};
