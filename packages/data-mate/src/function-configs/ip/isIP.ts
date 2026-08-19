import { isIP } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isIPSql } from './sql-utils.js';

export const isIPConfig: FieldValidateConfig = {
    name: 'isIP',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '11.0.1.18',
            output: '11.0.1.18',
        },
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
            input: '172.394.0.1',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Number } } },
            field: 'testField',
            input: 1234567,
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
    description: 'Returns the input if it is a valid IPv4 or IPv6 IP address.  Accepts dot notation for IPv4 addresses and hexadecimal separated by colons for IPv6 addresses',
    create() {
        return isIP;
    },
    /**
     * The union of the two parsers, not `TRY_CAST(x AS INET) IS NOT NULL`.
     *
     * The naive cast is wrong twice over and silently: it accepts `01.02.03.04`, which data-mate
     * rejects for the leading zeros, and it accepts `1.2.3.4/24`, which data-mate calls a CIDR
     * rather than an IP. Both are excluded inside `isIPSql`.
    */
    sql: {
        expression: ({ value }) => isIPSql(value),
    },
    accepts: [FieldType.String, FieldType.IP]
};
