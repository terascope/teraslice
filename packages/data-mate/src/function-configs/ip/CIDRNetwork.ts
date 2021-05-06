import { CIDRNetwork } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory, FieldTransformConfig
} from '../interfaces';

export const CIDRNetworkConfig: FieldTransformConfig = {
    name: 'CIDRNetwork',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.12.118/24',
            output: '8.8.12.0',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '1.2.3.4/32',
            output: '1.2.3.4',
        }
    ],
    description: 'Returns the network address of a CIDR range, only applicable to IPv4 addresses',
    create() { return CIDRNetwork; },
    accepts: [FieldType.String],
};