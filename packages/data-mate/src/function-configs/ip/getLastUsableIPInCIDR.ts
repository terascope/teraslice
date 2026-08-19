import { getLastUsableIPInCIDR } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces.js';
import {
    isCIDRSql, cidrBroadcast, isMappedResult, isSingleAddress,
} from './sql-utils.js';

export const getLastUsableIPInCIDRConfig: FieldTransformConfig = {
    name: 'getLastUsableIPInCIDR',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.12.118/24',
            output: '8.8.12.254',
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
    description: 'Returns the last address of a CIDR range, excluding the broadcast address for IPv4 addresses',
    create() {
        return getLastUsableIPInCIDR;
    },
    /**
     * Broadcast - 1 for IPv4, the broadcast itself for IPv6 - which has no broadcast concept - and
     * for a single-address block either way.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN NOT ${isCIDRSql(value)}`
            + ` OR ${isMappedResult(value)} THEN ${udf(value)}`
            + ` WHEN ${isSingleAddress(value)} THEN host(${cidrBroadcast(value)})`
            + ` WHEN NOT contains(${value}, ':') THEN host(${cidrBroadcast(value)} - 1)`
            + ` ELSE host(${cidrBroadcast(value)}) END`,
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
