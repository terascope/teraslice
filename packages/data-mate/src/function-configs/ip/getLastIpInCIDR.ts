import { getLastIPInCIDR } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces.js';
import {
    isCIDRSql, cidrBroadcast, isMappedResult,
} from './sql-utils.js';

export const getLastIPInCIDRConfig: FieldTransformConfig = {
    name: 'getLastIPInCIDR',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.12.118/24',
            output: '8.8.12.255',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:0db8:0123:4567:89ab:cdef:1234:5678/128',
            output: '2001:db8:123:4567:89ab:cdef:1234:5678',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:0db8:0123:4567:89ab:cdef:1234:5678/46',
            output: '2001:db8:123:ffff:ffff:ffff:ffff:ffff',
        }
    ],
    description: 'Returns the last address of a CIDR range, all inclusive',
    create() {
        return getLastIPInCIDR;
    },
    /** The broadcast address - the last IP in the block, inclusive. */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isCIDRSql(value)}`
            + ` AND NOT ${isMappedResult(value)} THEN host(${cidrBroadcast(value)})`
            + ` ELSE ${udf(value)} END`,
    },
    accepts: [FieldType.String, FieldType.IPRange],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.IP
            }
        };
    }
};
