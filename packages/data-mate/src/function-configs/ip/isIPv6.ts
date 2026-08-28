import { isIPv6 } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isIPv6Sql } from './sql-utils.js';

export const isIPv6Config: FieldValidateConfig = {
    name: 'isIPv6',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:db8:85a3:8d3:1319:8a2e:370:7348',
            output: '2001:db8:85a3:8d3:1319:8a2e:370:7348',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'fc00:db8::1',
            output: 'fc00:db8::1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '::FFFF:12.155.166.101',
            output: '::FFFF:12.155.166.101',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '11.0.1.18',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'not an IP address',
            output: null,
        },
    ],
    description: 'Returns the input if it is a valid IPv6 IP address in hexadecimal separated by colons format, otherwise returns null.',
    create() {
        return isIPv6;
    },
    /**
     * A colon, no prefix, and a cast that survives - with the scope ID stripped first.
     *
     * `IPAddress.isIPv6` requires a colon before it parses at all, and it truncates at `%`, so
     * `fe80::1%eth0` is valid to data-mate while `INET` rejects it outright.
    */
    sql: {
        expression: ({ value }) => isIPv6Sql(value),
    },
    accepts: [FieldType.String, FieldType.IP],
};
