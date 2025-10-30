import { ipToInt } from '@terascope/ip-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

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
