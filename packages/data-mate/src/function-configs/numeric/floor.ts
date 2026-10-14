import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { runMathFn } from './utils.js';
import { withinIntegerRange } from '../sql-helpers.js';

export const floorConfig: FieldTransformConfig = {
    name: 'floor',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Rounds a number down to the previous largest integer',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0.95,
            output: 0
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0.10,
            output: 0
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -7.004,
            output: -8
        }
    ],
    create() {
        return runMathFn(Math.floor);
    },
    /**
     * `floor()` inside the `Integer` range, the UDF outside it.
     *
     * `output_type` makes the result an `Integer`. Outside that range the UDF returns a wrapped
     * BIGINT as a string (`1e21` gives `"3875820019684212735"`) where SQL would return the true
     * value, so values that large keep the UDF and their result does not change.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `${withinIntegerRange(value, `floor(${value})`)}`
            + ` ELSE ${udf(value)} END`,
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Integer
            }
        };
    }
};
