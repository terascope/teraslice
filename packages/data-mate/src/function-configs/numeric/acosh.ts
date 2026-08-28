import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull, inDomain } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const acoshConfig: FieldTransformConfig = {
    name: 'acosh',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the hyperbolic arc-cosine of a given number. If given the number is less than 1, returns null.',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 1,
            output: 0
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0,
            output: null,
            description: 'Since this function doesn\'t work with numbers less than or equal to 0, null will be returned'
        }
    ],
    create() {
        return runMathFn(Math.acosh);
    },
    /**
     * `acosh`, with its domain checked first.
     *
     * `Math.acosh` below 1 is NaN -> null; DuckDB raises instead.
    */
    sql: {
        // transcendental: DuckDB's libm and V8 differ in the last bit, which IEEE 754
        // permits. The gate compares these to a few ULP - see `approximate`.
        approximate: true,
        expression: ({ value }) => finiteOrNull(inDomain(`${value} >= 1`, `acosh(${value})`)),
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Float
            }
        };
    }
};
