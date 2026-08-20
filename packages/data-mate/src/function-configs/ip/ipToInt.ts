import { ipToInt } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';
import { isIPv4Sql } from './sql-utils.js';

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
     * IPv4 only, as octet arithmetic.
     *
     * There is no `inet_aton` and no cast between `INET` and a number, so the octets are split out
     * and weighted. IPv6 needs 128 UNSIGNED bits where `HUGEINT` is signed, so it keeps the UDF -
     * along with anything that is not an address, which throws there as it does today.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => {
            const part = (n: number) => `CAST(string_split(${value}, '.')[${n}] AS HUGEINT)`;
            return `CASE WHEN ${isIPv4Sql(value)}`
                + ` THEN ${part(1)} * 16777216 + ${part(2)} * 65536`
                + ` + ${part(3)} * 256 + ${part(4)}`
                + ` ELSE ${udf(value)} END`;
        },
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
