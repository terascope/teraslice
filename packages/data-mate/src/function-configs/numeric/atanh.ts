import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull, inDomain } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const atanhConfig: FieldTransformConfig = {
    name: 'atanh',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the arctangent (in radians) of the given number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0.5,
            output: 0.5493061443340548
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -1,
            output: null,
            description: 'Typically this would return -Infinity but that cannot be stored or serialized so null is returned'
        }
    ],
    create() {
        return runMathFn(Math.atanh);
    },
    /**
     * `atanh`, with its domain checked first.
     *
     * `Math.atanh` at or beyond +-1 is +-Infinity or NaN, both null after `runMathFn`; DuckDB raises.
    */
    sql: {
        // transcendental: DuckDB's libm and V8 differ in the last bit, which IEEE 754
        // permits. The gate compares these to a few ULP - see `approximate`.
        approximate: true,
        expression: ({ value }) => finiteOrNull(inDomain(`abs(${value}) < 1`, `atanh(${value})`)),
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            }
        };
    }
};
