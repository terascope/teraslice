import { isMACAddress, isString, joinList } from '@terascope/core-utils';
import { MACDelimiter, FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample,
} from '../interfaces.js';
import { MAC_SQL_PATTERNS, matchesAny } from './sql-validator-utils.js';

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
    sql: {
        /**
         * **Five fixed regexes, no backreference.** The backreference this was declined for is in
         * `validator.isMACAddress`; `core-utils` has its own `macAddressDelimiters` table and
         * `'any'` is `Object.values(...).some(...)`, so separator consistency falls out of the
         * patterns rather than needing to be checked. See `MAC_SQL_PATTERNS`.
         *
         * An ARRAY `delimiter` is declined because the implementation cannot handle one either:
         * `macAddressDelimiters[['colon']]` is `undefined` and `.test` throws.
        */
        applies: ({ delimiter }) => delimiter == null
            || (typeof delimiter === 'string'
                && (delimiter === 'any' || MAC_SQL_PATTERNS[delimiter] != null)),
        expression: ({ value, args: { delimiter } }) => (
            delimiter == null || delimiter === 'any'
                ? matchesAny(value, Object.values(MAC_SQL_PATTERNS))
                : matchesAny(value, [MAC_SQL_PATTERNS[delimiter as string]])
        ),
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
