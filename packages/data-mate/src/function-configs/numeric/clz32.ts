import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const clz32Config: FieldTransformConfig = {
    name: 'clz32',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the number of leading zero bits in the 32-bit binary representation of a number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 1,
            output: 31
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: 1000,
            output: 22
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 4,
            output: 29
        }
    ],
    create() {
        return runMathFn(Math.clz32);
    },
    /**
     * `Math.clz32`, computed from the binary string rather than `log2`.
     *
     * `Math.clz32` first converts its argument to an unsigned 32-bit integer, truncating the
     * fraction and wrapping negatives: `clz32(-1)` is `0` because `-1` becomes `0xFFFFFFFF`. The
     * leading zeros are then `32 - length(ltrim(bin(u), '0'))`, which is exact, where
     * `31 - floor(log2(u))` would rely on floating point.
    */
    sql: {
        expression: ({ value }) => {
            const unsigned = `((CAST(trunc(${value}) AS HUGEINT) % 4294967296)`
                + ' + 4294967296) % 4294967296';
            return finiteOrNull(
                `32 - length(ltrim(bin(CAST(${unsigned} AS UBIGINT)), '0'))`
            );
        },
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Byte
            }
        };
    }
};
