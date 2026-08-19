import { extractMappedIPv4 } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces.js';
import {
    isMappedIPv4Sql, asInet,
} from './sql-utils.js';

export const extractMappedIPv4Config: FieldTransformConfig = {
    name: 'extractMappedIPv4',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '::FFFF:192.52.193.1',
            output: '192.52.193.1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '::122.168.5.18',
            output: '122.168.5.18',
        }
    ],
    description: 'Extracts a mapped IPv4 address from an IPv6 address and returns the IPv4 address',
    create() {
        return extractMappedIPv4;
    },
    /**
     * The embedded IPv4, which `host()` already prints as the dotted tail of a mapped address -
     * `::ffff:1.2.3.4` - so the extraction is dropping that prefix rather than masking 32 bits.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isMappedIPv4Sql(value)}`
            + ` THEN regexp_replace(host(${asInet(value)}), '^::(ffff:)?', '')`
            + ` ELSE ${udf(value)} END`,
    },
    accepts: [FieldType.String, FieldType.IP],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.IP
            }
        };
    }
};
