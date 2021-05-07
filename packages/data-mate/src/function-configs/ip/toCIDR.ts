import {
    toCIDR,
    isNumberLike,
    toNumber,
    toString
} from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const toCIDRConfig: FieldTransformConfig = {
    name: 'toCIDR',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: { suffix: 32 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '1.2.3.4',
            output: '1.2.3.4/32',
        },
        {
            args: { suffix: 24 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '1.2.3.4',
            output: '1.2.3.0/24',
        },
        {
            args: { suffix: '46' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:0db8:0123:4567:89ab:cdef:1234:5678',
            output: '2001:db8:120::/46',
        }
    ],
    description: 'Returns a CIDR address based on the provided ip and suffix',
    accepts: [FieldType.String, FieldType.IP],
    create({ suffix }) {
        return (input: unknown) => toCIDR(input, toString(suffix));
    },
    validate_arguments({ suffix }) {
        if (isNumberLike(suffix)) {
            const asInt = toNumber(suffix);

            if (asInt >= 0 && asInt <= 128) return;
        }

        throw Error('suffix must be between 0 and 32 for IPv4 address and 0 and 128 for IPv6 addresses');
    }
};
