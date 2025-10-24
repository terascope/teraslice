import { toNumber, toBigIntOrThrow } from '@terascope/core-utils';
import { parseDateValue } from '@terascope/date-utils';
import { ipToInt } from '@terascope/ip-utils';
import { FieldType, DateFormat } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, isNumericType
} from '../interfaces.js';

export const toNumberConfig: FieldTransformConfig = {
    name: 'toNumber',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Converts an entity to a number, can handle IPs and Dates',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: String(Number.MAX_SAFE_INTEGER),
            output: Number.MAX_SAFE_INTEGER
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: '22',
            output: 22
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: '22',
            output: 22
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.IP } } },
            field: 'testField',
            input: '10.16.32.210',
            output: 168829138
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.IP } } },
            field: 'testField',
            input: '2001:2::',
            output: '42540488320432167789079031612388147199'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Date } } },
            field: 'testField',
            input: '2001-01-01T01:00:00.000Z',
            output: 978310800000
        },
    ],
    create({ inputConfig }) {
        if (inputConfig) {
            const { type } = inputConfig.field_config;

            if (type === FieldType.IP) {
                return ipToInt;
            }

            if (type === FieldType.Date) {
                const format = DateFormat.epoch_millis;
                const date = new Date();

                return (input: unknown) => parseDateValue(input, format, date);
            }

            if (type === FieldType.Long) {
                return (input: unknown) => toBigIntOrThrow(input);
            }
        }

        return convertToNumber;
    },
    accepts: [],
    argument_schema: {},
    output_type({ field_config }) {
        let { type } = field_config;

        if (type === FieldType.IP) {
            type = FieldType.Long;
        } else if (!isNumericType(field_config)) {
            type = FieldType.Number;
        }

        return {
            field_config: {
                ...field_config,
                type
            }
        };
    }
};

function convertToNumber(input: unknown) {
    const num = toNumber(input);
    if (isNaN(num)) {
        throw new Error(`Could not convert "${input}" to number`);
    }

    return num;
}
