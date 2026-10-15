import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const atanConfig: FieldTransformConfig = {
    name: 'atan',
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
            input: 1,
            output: 0.7853981633974483
        }
    ],
    create() {
        return runMathFn(Math.atan);
    },
    /** Native `atan`, which is defined for every input, so no domain guard is needed. */
    sql: {
        // DuckDB and V8 can differ in the last bit of a transcendental result, which
        // IEEE 754 allows, so `approximate` compares results to within a few ULP
        approximate: true,
        expression: ({ value }) => finiteOrNull(`atan(${value})`),
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
