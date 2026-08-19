import { isRoutableIP } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isRoutableSql } from './sql-utils.js';

export const isRoutableIPConfig: FieldValidateConfig = {
    name: 'isRoutableIP',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.8.8',
            output: '8.8.8.8',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2620:4f:123::',
            output: '2620:4f:123::',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '192.168.255.254',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:4:112::',
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
    description: 'Returns the input if it is a routable IPv4 or IPv6 address.  See https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml and https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml',
    create() {
        return isRoutableIP;
    },
    /**
     * A disjunction of `<<=` tests against the reserved-range tables, because the extension has no
     * classification predicate of its own.
     *
     * The arm order matters and is `IPAddress.isRoutable`'s: a mapped address is judged by its
     * embedded IPv4 BEFORE the IPv6 table is consulted, so `::ffff:8.8.8.8` is routable even though
     * `::ffff:0:0/96` is itself non-routable.
    */
    sql: {
        expression: ({ value }) => isRoutableSql(value),
    },
    accepts: [FieldType.String, FieldType.IP],
};
