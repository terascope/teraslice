import { intToIP, toString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';

import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

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
