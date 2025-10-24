import { FieldType } from '@terascope/types';
import { isNumber, isString } from '@terascope/core-utils';
import { setTimezoneFP, timezoneToOffset, toISO8601 } from '@terascope/date-utils';
import {
    ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory,
    FieldTransformConfig
} from '../interfaces.js';

export interface SetTimezoneArgs {
    timezone: number | string;
}

export const setTimezoneConfig: FieldTransformConfig<SetTimezoneArgs> = {
    name: 'setTimezone',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input date with the timezone set to the args value.',
    examples: [
        {
            args: { timezone: 420 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: [new Date('2021-05-14T20:45:30.000Z').getTime(), 7 * 60],
            serialize_output: toISO8601
        },
        {
            args: { timezone: 'America/Phoenix' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '2021-05-14T20:45:30.000Z',
            output: [new Date('2021-05-14T20:45:30.000Z').getTime(), -7 * 60],
            serialize_output: toISO8601
        },
        {
            args: { timezone: 120 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: '2020-02-14T20:45:30.091Z',
            output: [new Date('2020-02-14T20:45:30.091Z').getTime(), 2 * 60],
            serialize_output: toISO8601
        },
        {
            args: { timezone: 'Europe/Paris' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Date } }
            },
            field: 'testField',
            input: '2020-02-14T20:45:30.091Z',
            output: [new Date('2020-02-14T20:45:30.091Z').getTime(), timezoneToOffset('Europe/Paris')],
            serialize_output: toISO8601
        }
    ],
    create({ args: { timezone } }) {
        return setTimezoneFP(timezone);
    },
    argument_schema: {
        timezone: {
            type: FieldType.Any,
            description: 'Value to set timezone to in minutes or timezone name.  Offset must be between -1440 and 1440'
        }
    },
    required_arguments: ['timezone'],
    validate_arguments({ timezone }) {
        if (isNumber(timezone)) {
            if (timezone >= -1440 && timezone <= 1440) return;
            throw new Error('Expected timezone offset to be between -1440 and 1440');
        }
        if (isString(timezone)) return;

        throw new Error('Expected timezone to be a string or a number');
    },
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Date
            }
        };
    }
};
