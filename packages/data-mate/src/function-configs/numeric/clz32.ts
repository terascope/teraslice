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
     * `Math.clz32`, via the binary rendering rather than `log2`.
     *
     * Two things it has to do. **`ToUint32` first**: `Math.clz32` coerces its argument to an
     * unsigned 32-bit integer, so it truncates the fraction and WRAPS - `clz32(-1)` is `0`, not 32,
     * because `-1` becomes `0xFFFFFFFF`. And then count the leading zeros, which
     * `32 - length(ltrim(bin(u), '0'))` does exactly, where `31 - floor(log2(u))` would be a
     * floating-point answer to an integer question. Verified against `Math.clz32` for 0, 1, 2, 255,
     * 2^32-1, -1, 2.5 and -2.5.
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
