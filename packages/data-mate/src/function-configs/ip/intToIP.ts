import { toString } from '@terascope/core-utils';
import { intToIP } from '@terascope/ip-utils';
import { intToIPv4Sql, plainIntegerSql } from './sql-utils.js';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';
import { STRING_FIELD_TYPES } from '../sql-helpers.js';

export interface IntToIPArgs {
    version: string | number;
}

export const intToIPConfig: FieldTransformConfig<IntToIPArgs> = {
    name: 'intToIP',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: { version: 4 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 168829138,
            output: '10.16.32.210',
        },
        {
            args: { version: '6' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '42540488320432167789079031612388147200',
            output: '2001:2::',
        }
    ],
    argument_schema: {
        version: {
            type: FieldType.Any,
            description: 'Which version of IP to create, 4 => IPv4, 6 => IPv6'
        }
    },
    sql: {
        /**
         * **IPv4 only, and only for an input SQL reads the same way `BigInt` does.**
         *
         * Version 6 needs 128 unsigned bits and `HUGEINT` is signed, so it keeps the UDF - the same
         * wall `ipToInt` hit from the other direction. For version 4 the arithmetic is exact; the
         * work is in the guard, which is `plainIntegerSql`'s digit regex plus the range check
         * `intToIP` does itself (`bigInt > 2n ** 32n - 1n` THROWS). Everything the guard declines -
         * a float string, `'0x10'`, an empty string, a value out of range - reaches the UDF and
         * gets today's answer, whether that is a value or the function's own error.
        */
        needs_udf_fallback: true,
        applies: ({ version }) => toString(version) === '4',
        expression: ({ value, inputConfig, udf }) => {
            // the string FAMILY, not `FieldType.String`: a `Keyword` column holds strings too,
            // and `floor()` on a VARCHAR is a binder error rather than a slow path
            const asInt = STRING_FIELD_TYPES.includes(inputConfig.field_config.type as FieldType)
                ? plainIntegerSql(value)
                // a numeric column: `BigInt(10.5)` THROWS, so a non-integer keeps the UDF
                : `CASE WHEN ${value} = floor(${value}) THEN CAST(${value} AS HUGEINT) ELSE NULL END`;
            return `CASE WHEN (${asInt}) BETWEEN 0 AND 4294967295`
                + ` THEN ${intToIPv4Sql(`(${asInt})`)} ELSE ${udf(value)} END`;
        },
    },
    accepts: [FieldType.String, FieldType.Number],
    required_arguments: ['version'],
    description: 'Converts an integer to an IP address, must provide the version of the returned IP address.',
    create({ args: { version } }) {
        return (input: unknown) => intToIP(input, toString(version));
    },
    validate_arguments({ version }) {
        if (!['4', '6'].includes(toString(version))) {
            throw Error('version must be 4 or 6');
        }
    },
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.IP
            }
        };
    }
};
