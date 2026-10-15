import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const tanConfig: FieldTransformConfig = {
    name: 'tan',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the tangent of a number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 1,
            output: 1.5574077246549023
        }
    ],
    create() {
        return runMathFn(Math.tan);
    },
    /** Native `tan`. */
    sql: {
        // DuckDB and V8 can differ in the last bit of a transcendental result, which
        // IEEE 754 allows, so `approximate` compares results to within a few ULP
        approximate: true,
        expression: ({ value }) => finiteOrNull(`tan(${value})`),
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
