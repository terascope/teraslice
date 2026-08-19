import { inIPRange, isIP, isCIDR } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';
import { asInet, isIPSql } from './sql-utils.js';

export interface InIPRangeArgs {
    min?: string;
    max?: string;
    cidr?: string;
}

export const inIPRangeConfig: FieldValidateConfig = {
    name: 'inIPRange',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: { cidr: '8.8.8.0/24' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.8.8',
            output: '8.8.8.8',
        },
        {
            args: { min: 'fd00::123', max: 'fd00::ea00' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'fd00::b000',
            output: 'fd00::b000',
        },
        {
            args: { min: 'fd00::123' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'fd00::b000',
            output: 'fd00::b000',
        },
        {
            args: { cidr: '8.8.8.0/24' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.10.8',
            output: null,
        }
    ],
    description: 'Returns the input if the IP is within the given range, boundaries are inclusive. Accepts min, max or cidr notation for the IP range, also accepts min without a max and vice versa.',
    create({ args }) {
        return (input: unknown) => inIPRange(input, args);
    },
    /**
     * The `cidr` form only - `applies` declines the rest, and that is a correctness boundary.
     *
     * `min`/`max` compare the raw integers in data-mate, so `::1` sits inside
     * `0.0.0.0`-`255.255.255.255`; `INET` ordering puts every IPv4 address before every
     * IPv6 one and answers false. That divergence is not fixable by a guard, so those arguments
     * keep the UDF. `validate_arguments` has already rejected a malformed `cidr` by the time this
     * runs.
    */
    sql: {
        applies: (args) => args.cidr != null && args.min == null && args.max == null,
        expression: ({ value, args }) => `(${isIPSql(value)} AND ${asInet(value)}`
            + ` <<= INET ${sqlLiteral(args.cidr as string)})`,
    },
    accepts: [FieldType.String, FieldType.IP],
    argument_schema: {
        min: {
            type: FieldType.String,
            description: 'IPv4 or IPv6 value, used for the bottom of the range, this value inclusive'
        },
        max: {
            type: FieldType.String,
            description: 'IPv4 or IPv6 value, used for the top of the range, this value inclusive'
        },
        cidr: {
            type: FieldType.String,
            description: 'IPv4 or IPv6 range expressed in CIDR notation, this value inclusive'
        }
    },
    validate_arguments({ min, max, cidr }: InIPRangeArgs) {
        if (min && !isIP(min)) {
            throw Error('min must be a valid IP address');
        }

        if (max && !isIP(max)) {
            throw Error('max must be a valid IP address');
        }

        if (cidr && !isCIDR(cidr)) {
            throw Error('cidr must be a valid cidr address');
        }
    }
};
