import { parsePhoneNumber } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '+33-1-22-33-44-55',
        output: '33122334455'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '1(800)FloWErs',
        output: '18003569377',
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Number } } },
        field: 'testField',
        input: 4917600000000,
        output: '4917600000000'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Number } } },
        field: 'testField',
        input: 49187484,
        output: '49187484'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'something',
        output: null,
        fails: true
    },
];

export const toISDNConfig: FieldTransformConfig = {
    name: 'toISDN',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts the input to the ISDN format, if it is a valid phone number.  Otherwise returns null.',
    examples,
    create() {
        return (input: unknown) => parsePhoneNumber(input as string);
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
    ],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            }
        };
    }
};
