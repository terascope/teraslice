import { getCIDRMin } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces.js';

export const getCIDRMinConfig: FieldTransformConfig = {
    name: 'getCIDRMin',
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
        return getCIDRMin;
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
