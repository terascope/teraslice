import { getCIDRBroadcast } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces.js';
import {
    isIPv4CIDRSql, cidrBroadcast,
} from './sql-utils.js';

export const getCIDRBroadcastConfig: FieldTransformConfig = {
    name: 'getCIDRBroadcast',
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
            input: '1.2.3.4/32',
            output: '1.2.3.4',
        }
    ],
    description: 'Returns the broadcast address of a CIDR range, only applicable to IPv4 addresses',
    create() {
        return getCIDRBroadcast;
    },
    /** IPv4 only, for the same reason as `getCIDRNetwork`. */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isIPv4CIDRSql(value)}`
            + ` THEN host(${cidrBroadcast(value)}) ELSE ${udf(value)} END`,
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
