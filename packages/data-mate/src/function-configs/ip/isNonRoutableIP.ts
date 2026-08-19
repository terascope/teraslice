import { isNonRoutableIP } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isIPSql, isRoutableSql } from './sql-utils.js';

export const isNonRoutableIPConfig: FieldValidateConfig = {
    name: 'isNonRoutableIP',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '192.168.0.1',
            output: '192.168.0.1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:db8::1',
            output: '2001:db8::1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '172.28.4.1',
            output: '172.28.4.1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.8.8',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:2ff::ffff',
            output: null,
        },
    ],
    description: 'Returns the input if it is a non-routable IP address, handles IPv6 and IPv4 address. See https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml and https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml',
    create() {
        return isNonRoutableIP;
    },
    /**
     * Not routable, AND an IP at all.
     *
     * The second half is not redundant: `isRoutableSql` answers false for a non-address, and
     * negating that alone would call `'not-an-ip'` a non-routable IP.
    */
    sql: {
        expression: ({ value }) => `(${isIPSql(value)} AND NOT (${isRoutableSql(value)}))`,
    },
    accepts: [FieldType.String, FieldType.IP],
};
