import { toNumber, toBigIntOrThrow, parseDateValue } from '@terascope/core-utils';
import { ipToInt } from '@terascope/ip-utils';
import { FieldType, DateFormat } from '@terascope/types';
import { ipv4ToIntSql, isIPv4Sql } from '../ip/sql-utils.js';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, isNumericType
} from '../interfaces.js';

/** The field types whose DuckDB representation can hold `nan` - the only ones needing the guard. */
const NAN_CAPABLE: readonly FieldType[] = [FieldType.Number, FieldType.Float, FieldType.Double];

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
    sql: {
        /**
         * `create` branches on the COLUMN TYPE, and so does this - three of its four branches have
         * an exact native form and the fourth does not.
         *
         * | column | what `create` returns | emission |
         * |---|---|---|
         * | `Date` | `parseDateValue(v, epoch_millis)` | `epoch_ms(v)` - exact, four instants |
         * | `IP` | `ipToInt` | the IPv4 arithmetic, IPv6 to the UDF - `ipToInt`'s own shape |
         * | `Long` | `toBigIntOrThrow` | identity: a BIGINT column already holds one |
         * | `Byte`/`Short`/`Integer` | `toNumber` | identity: no integer is `NaN` |
         * | `Float`/`Double`/`Number` | `toNumber`, THROWS on `NaN` | identity, `NaN` to UDF |
         *
         * **A String column keeps the UDF, deliberately.** `convertToNumber` is `Number(input)`,
         * and `Number('')` is `0`, `Number('0x10')` is `16` and `Number(' 12 ')` is `12` -
         * measured, no DuckDB cast reproduces that set
         * (`docs/tools/probe/group-a-candidates.mjs`), and the failure mode is a wrong number
         * rather than an error.
        */
        needs_udf_fallback: true,
        types: [FieldType.Date, FieldType.IP, FieldType.Number],
        applies: (_args, inputConfig) => {
            const { type } = inputConfig.field_config;
            return type === FieldType.Date || type === FieldType.IP
                || isNumericType(inputConfig.field_config);
        },
        expression: ({ value, inputConfig, udf }) => {
            const { type } = inputConfig.field_config;
            if (type === FieldType.Date) return `epoch_ms(${value})`;
            if (type === FieldType.IP) {
                return `CASE WHEN ${isIPv4Sql(value)}`
                    + ` THEN ${ipv4ToIntSql(value)} ELSE ${udf(value)} END`;
            }
            // `convertToNumber` THROWS on NaN, and only a floating-point column can hold one
            if (NAN_CAPABLE.includes(type as FieldType)) {
                return `CASE WHEN isnan(${value}) THEN ${udf(value)} ELSE ${value} END`;
            }
            return value;
        },
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
