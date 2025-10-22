import { isIPv4 } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const isIPv4Config: FieldValidateConfig = {
    name: 'isIPv4',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '11.0.1.18',
            output: '11.0.1.18',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:db8:85a3:8d3:1319:8a2e:370:7348',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '172.394.0.1',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'not an IP address',
            output: null,
        },
    ],
    description: 'Returns the input if it is a valid IPv4 address in dot notation, otherwise returns null',
    create() {
        return isIPv4;
    },
    accepts: [FieldType.String, FieldType.IP],
};
