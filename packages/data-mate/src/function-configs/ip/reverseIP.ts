import { reverseIP } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';
import {
    isIPv4Sql,
} from './sql-utils.js';

export const reverseIPConfig: FieldTransformConfig = {
    name: 'reverseIP',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '10.16.32.210',
            output: '210.32.16.10',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:0db8:0000:0000:0000:8a2e:0370:7334',
            output: '4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:2::',
            output: '0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.1.0.0.2',
        }
    ],
    description: 'Returns the IP address in reverse notation, accepts both IPv4 and IPv6 addresses',
    create() {
        return reverseIP;
    },
    /**
     * IPv4 only: the octets in reverse, which is the PTR form.
     *
     * IPv6 reverses NIBBLES from the fully expanded address - a different algorithm, and one with
     * no native equivalent - so it goes to the UDF.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${isIPv4Sql(value)}`
            + ` THEN array_to_string(list_reverse(string_split(${value}, '.')), '.')`
            + ` ELSE ${udf(value)} END`,
    },
    accepts: [FieldType.String, FieldType.IP],
};
