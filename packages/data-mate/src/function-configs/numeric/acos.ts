import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull, inDomain } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const acosConfig: FieldTransformConfig = {
    name: 'acos',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns a numeric value between 0 and π radians for x between -1 and 1',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -1,
            output: Math.PI
        }
    ],
    create() {
        return runMathFn(Math.acos);
    },
    /**
     * `acos`, with its domain checked first.
     *
     * `Math.acos` outside [-1, 1] is NaN -> null; DuckDB raises instead, so the domain is checked first.
    */
    sql: {
        // transcendental: DuckDB's libm and V8 differ in the last bit, which IEEE 754
        // permits. The gate compares these to a few ULP - see `approximate`.
        approximate: true,
        expression: ({ value }) => finiteOrNull(inDomain(`abs(${value}) <= 1`, `acos(${value})`)),
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
