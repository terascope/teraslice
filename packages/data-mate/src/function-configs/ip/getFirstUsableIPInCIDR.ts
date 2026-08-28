import { getFirstUsableIPInCIDR } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces.js';
import {
    isCIDRSql, cidrNetwork, isMappedResult, isSingleAddress, firstUsableHitsTopOfV4,
} from './sql-utils.js';

export const getFirstUsableIPInCIDRConfig: FieldTransformConfig = {
    name: 'getFirstUsableIPInCIDR',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.12.118/24',
            output: '8.8.12.1',
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
            output: '2001:db8:120::1',
        }
    ],
    description: 'Returns the first address of a CIDR range, excluding the network address',
    create() {
        return getFirstUsableIPInCIDR;
    },
    /**
     * Network + 1, except for a single-address block, which is its own first usable address.
     *
     * `firstUsableHitsTopOfV4` sends the one block whose answer is `255.255.255.255` to the UDF:
     * DuckDB refuses to reach that address by addition.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN NOT ${isCIDRSql(value)}`
            + ` OR ${isMappedResult(value)} OR ${firstUsableHitsTopOfV4(value)} THEN ${udf(value)}`
            + ` WHEN ${isSingleAddress(value)} THEN host(${cidrNetwork(value)})`
            + ` ELSE host(${cidrNetwork(value)} + 1) END`,
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
