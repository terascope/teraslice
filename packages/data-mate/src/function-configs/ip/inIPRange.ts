import { inIPRange, isIP, isCIDR } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

interface InIPRangeArgs {
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
    description: 'Checks if the ip is within a range, inclusive.  Accepts min, max or cidr notation for the ip range.  Function accepts min without a max and vice versa.',
    create(args: InIPRangeArgs) {
        return (input: unknown) => inIPRange(input, args);
    },
    accepts: [FieldType.String],
    argument_schema: {
        min: {
            type: FieldType.String,
            description: 'IPv4 or IPv6 value, used for the bottom of the range'
        },
        max: {
            type: FieldType.String,
            description: 'IPv4 or IPv6 value, used for the top of the range'
        },
        cidr: {
            type: FieldType.String,
            description: 'IPv4 or IPv6 range expressed in CIDR notation'
        }
    },
    validate_arguments({ min, max, cidr }: InIPRangeArgs) {
        if (min && !isIP(min)) {
            throw Error('min must be a valid ip address');
        }

        if (max && !isIP(max)) {
            throw Error('max must be a valid ip address');
        }

        if (cidr && !isCIDR(cidr)) {
            throw Error('cidr must be a valid cidr address');
        }
    }
};
