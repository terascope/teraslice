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
     * `Math.acos` outside [-1, 1] is NaN, which becomes null; DuckDB raises an error instead.
    */
    sql: {
        // DuckDB and V8 can differ in the last bit of a transcendental result, which
        // IEEE 754 allows, so `approximate` compares results to within a few ULP
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
