import { isCIDR } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isCIDRSql } from './sql-utils.js';

export const isCIDRConfig: FieldValidateConfig = {
    name: 'isCIDR',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '1.2.3.4/32',
            output: '1.2.3.4/32',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001::1234:5678/128',
            output: '2001::1234:5678/128',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.8.10',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'badIPAddress/24',
            output: null,
        }
    ],
    description: 'Returns the input if it is a valid IPv4 or IPv6 IP address in CIDR notation, otherwise returns null',
    create() {
        return isCIDR;
    },
    /**
     * A prefix must be present - which is the whole difference between this and `isIP`.
     *
     * `TRY_CAST` accepts a bare address as an implicit `/32`, so without the `contains` test this
     * would call every IP a CIDR.
    */
    sql: {
        expression: ({ value }) => isCIDRSql(value),
    },
    accepts: [FieldType.String, FieldType.IPRange],
};
