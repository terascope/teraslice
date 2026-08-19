import { isMappedIPv4 } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isMappedIPv4Sql } from './sql-utils.js';

export const isMappedIPv4Config: FieldValidateConfig = {
    name: 'isMappedIPv4',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '::ffff:10.2.1.18',
            output: '::ffff:10.2.1.18',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '::122.168.5.18',
            output: '::122.168.5.18',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '10.16.32.210',
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
    description: 'Returns the input if it is an IPv4 address mapped to an IPv6 address, otherwise returns null',
    create() {
        return isMappedIPv4;
    },
    /**
     * Containment in `::ffff:0:0/96`, OR the deprecated `::a.b.c.d` spelling.
     *
     * The second arm has to be textual: data-mate answers true for `::0.0.0.0` and false for `::`,
     * which are the same 128 bits, because it records how the value was written.
    */
    sql: {
        expression: ({ value }) => isMappedIPv4Sql(value),
    },
    accepts: [FieldType.String, FieldType.IP],
};
