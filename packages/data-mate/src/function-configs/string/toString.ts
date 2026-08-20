import { toString, toISO8601 } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    DataTypeFieldAndChildren, FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';
import { STRING_FIELD_TYPES, NUMERIC_FIELD_TYPES } from '../sql-helpers.js';

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Boolean } } },
        field: 'testField',
        input: true,
        output: 'true'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Object } } },
        field: 'testField',
        input: { hello: 'world' },
        output: '{"hello":"world"}'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Long } } },
        field: 'testField',
        input: BigInt(21) ** BigInt(20),
        output: '278218429446951548637196400'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Boolean, array: true } } },
        field: 'testField',
        input: [true, false],
        output: ['true', 'false']
    },
];

export const toStringConfig: FieldTransformConfig = {
    name: 'toString',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts the input value to a string.  If the input is an array each array item will be converted to a string.',
    examples,
    create({ inputConfig }) {
        if (inputConfig?.field_config.type === FieldType.Date) {
            return toISO8601;
        }

        return toString;
    },
    /**
     * One emission per starting type, because `toString` is a different conversion for each.
     *
     * - **String** - identity. `toString` returns a string unchanged.
     * - **Date** - `toISO8601`, which `create` substitutes for a `Date` column. Same `strftime`
     *   idiom the rest of the date group uses.
     * - **Boolean** - `String(true)` is `'true'`, and DuckDB's cast agrees.
     * - **Number** - `String(n)`, which needs two corrections and a guard.
     *   `5.0::DOUBLE::VARCHAR` is `'5.0'` where JavaScript writes `'5'`, so an integral value goes
     *   through `HUGEINT` (not `BIGINT` - `1e20` overflows it); and past `1e21` JavaScript switches
     *   to exponential form and writes `1e+21` where DuckDB writes `1e21`, which cannot be
     *   corrected, so that range and the non-finite values keep the UDF.
    */
    sql: {
        needs_udf_fallback: true,
        applies: (_args, inputConfig) => {
            const type = inputConfig.field_config.type as FieldType;
            return type === FieldType.Date
                || type === FieldType.Boolean
                || STRING_FIELD_TYPES.includes(type)
                || NUMERIC_FIELD_TYPES.includes(type);
        },
        expression: ({ value, inputConfig, udf }) => {
            const type = inputConfig.field_config.type as FieldType;
            if (STRING_FIELD_TYPES.includes(type)) return value;
            if (type === FieldType.Date) {
                return `strftime(${value}, '%Y-%m-%dT%H:%M:%S.%g') || 'Z'`;
            }
            // `::VARCHAR` rather than a CASE: it renders 'true'/'false' AND is null-safe, where
            // `CASE WHEN x THEN ... ELSE ...` sends a NULL down the ELSE branch
            if (type === FieldType.Boolean) return `${value}::VARCHAR`;
            // exponential form differs at BOTH ends: JavaScript writes `1e+21` and `1e-7` where
            // DuckDB writes `1e21` and `1e-07`. JS switches to it past 1e21 and below 1e-6.
            return `CASE WHEN NOT isfinite(${value}) OR abs(${value}) >= 1e21`
                + ` OR (${value} <> 0 AND abs(${value}) < 1e-6)`
                + ` THEN ${udf(value)}`
                + ` WHEN ${value} = floor(${value}) THEN CAST(${value} AS HUGEINT)::VARCHAR`
                + ` ELSE ${value}::VARCHAR END`;
        },
    },
    accepts: [],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
        };
    }
};
