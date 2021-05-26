import { isNonRoutableIP } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isNonRoutableIPConfig: FieldValidateConfig = {
    name: 'isNonRoutableIP',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.IP,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '192.168.0.1',
            output: '192.168.0.1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:db8::1',
            output: '2001:db8::1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '172.28.4.1',
            output: '172.28.4.1',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '8.8.8.8',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '2001:2ff::ffff',
            output: null,
        },
    ],
    description: 'Returns the input if it is a non-routable ip address, handles ipv6 and ipv4 address.  Non-routable ip ranges are private, uniqueLocal, loopback, unspecified, carrierGradeNat, linkLocal, reserved, rfc6052, teredo, 6to4, or broadcast',
    create() { return isNonRoutableIP; },
    accepts: [FieldType.String, FieldType.IP],
};
