import { IPToInt } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const IPToIntConfig: FieldTransformConfig = {
    name: 'IPToInt',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '10.16.32.210',
            output: BigInt(168829138),
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:2::',
            output: BigInt(42540488320432167789079031612388147200),
        }
    ],
    description: 'Returns the ip address in reverse notation, accepts both IPv4 and IPv6 addresses',
    create() { return IPToInt; },
    accepts: [FieldType.String],
};
