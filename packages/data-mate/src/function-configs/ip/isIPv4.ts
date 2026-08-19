import { isIPv4 } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isIPv4Sql } from './sql-utils.js';

export const isIPv4Config: FieldValidateConfig = {
    name: 'isIPv4',
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
            output: null,
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
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'not an IP address',
            output: null,
        },
    ],
    description: 'Returns the input if it is a valid IPv4 address in dot notation, otherwise returns null',
    create() {
        return isIPv4;
    },
    /**
     * `IPV4_RE` from `ip-utils`, transliterated, rather than anything `INET` offers.
     *
     * There is no `family()` in the extension, and the cast would take a leading-zero octet and a
     * `/prefix` that data-mate does not - so the regex IS the definition here.
    */
    sql: {
        expression: ({ value }) => isIPv4Sql(value),
    },
    accepts: [FieldType.String, FieldType.IP],
};
