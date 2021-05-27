import { extractMappedIPV4 } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const extractMappedIPV4Config: FieldTransformConfig = {
    name: 'extractMappedIPV4',
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
    create() { return extractMappedIPV4; },
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
