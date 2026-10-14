import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { runMathFn } from './utils.js';
import { withinIntegerRange } from '../sql-helpers.js';

export const roundConfig: FieldTransformConfig = {
    name: 'round',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the value of a number rounded to the nearest integer.',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0.95,
            output: 1
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
            output: -7
        }
    ],
    create() {
        return runMathFn(Math.round);
    },
    /**
     * `floor(x + 0.5)` inside the `Integer` range, the UDF outside it.
     *
     * `Math.round` breaks ties toward +infinity, while SQL's `round` breaks them away from zero
     * (`round(-2.5)` is `-2` in JavaScript and `-3` in SQL); `floor(x + 0.5)` follows the
     * JavaScript rule. Values outside the `Integer` range keep the UDF, as in `floor`.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `${withinIntegerRange(value, `floor(${value} + 0.5)`)}`
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
