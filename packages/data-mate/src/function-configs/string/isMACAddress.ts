import { isMACAddress, isString, joinList } from '@terascope/core-utils';
import { MACDelimiter, FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample,
} from '../interfaces.js';

const delimiterOptions = ['space', 'colon', 'dash', 'dot', 'none', 'any'];

export interface IsMACArgs {
    delimiter?: string | string[];
}

const examples: FunctionDefinitionExample<IsMACArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '00:1f:f3:5b:2b:1f',
        output: '00:1f:f3:5b:2b:1f',
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '001ff35b2b1f',
        output: '001ff35b2b1f',
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '00-1f-f3-5b-2b-1f',
        output: '00-1f-f3-5b-2b-1f',
    },

    {
        args: { delimiter: 'colon' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '00-1f-f3-5b-2b-1f',
        output: null,
    },
    {
        args: { delimiter: 'any' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '00-1f-f3-5b-2b-1f',
        output: '00-1f-f3-5b-2b-1f',
    },
    {
        args: { delimiter: 'dash' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '00-1f-f3-5b-2b-1f',
        output: '00-1f-f3-5b-2b-1f',
    },
    {
        args: { delimiter: 'dot' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '001f.f35b.2b1f',
        output: '001f.f35b.2b1f',
    },
    {
        args: { delimiter: 'none' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '001ff35b2b1f',
        output: '001ff35b2b1f',
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'aString',
        output: null,
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Number } } },
        field: 'testField',
        input: 4,
        output: null,
    },
];

export const isMACAddressConfig: FieldValidateConfig<IsMACArgs> = {
    name: 'isMACAddress',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a valid mac address, otherwise returns null.',
    examples,
    create({ args: { delimiter } }) {
        return (input: unknown) => isString(input)
            && isMACAddress(input, delimiter as MACDelimiter);
    },
    accepts: [FieldType.String],
    argument_schema: {
        delimiter: {
            type: FieldType.String,
            description: `Specify delimiter character for the mac address format, may be set to one of ${joinList(delimiterOptions)}`,
        }
    },
    required_arguments: [],
    validate_arguments({ delimiter }) {
        let delimiterValues: string[];

        if (!delimiter) return;

        if (delimiter && !Array.isArray(delimiter)) {
            delimiterValues = [delimiter];
        } else {
            delimiterValues = delimiter as string[];
        }

        delimiterValues.forEach((value) => {
            if (!delimiterOptions.includes(value)) {
                throw new Error(`Invalid mac address delimiter, must be a list of or one of ${joinList(delimiterOptions)}`);
            }
        });
    }
};
