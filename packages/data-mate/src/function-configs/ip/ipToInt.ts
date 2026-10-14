import { ipToInt } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';
import { ipv4ToIntSql, isIPv4Sql } from './sql-utils.js';

export const ipToIntConfig: FieldTransformConfig = {
    name: 'ipToInt',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '10.16.32.210',
            output: 168829138
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:2::',
            output: '42540488320432167789079031612388147199'
        }
    ],
    description: 'Returns the IP as an integer or a big int',
    create() {
        return ipToInt;
    },
    /**
     * IPv4 only, as octet arithmetic (see `ipv4ToIntSql`).
     *
     * IPv6 needs 128 unsigned bits and `HUGEINT` is signed, so it keeps the UDF, as does anything
     * that is not an address, which throws there.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isIPv4Sql(value)}`
            + ` THEN ${ipv4ToIntSql(value)} ELSE ${udf(value)} END`,
    },
    accepts: [FieldType.String, FieldType.IP],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Long
            }
        };
    }
};
