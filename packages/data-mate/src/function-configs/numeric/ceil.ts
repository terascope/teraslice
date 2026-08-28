import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { runMathFn } from './utils.js';
import { finiteOrNull, withinIntegerRange } from '../sql-helpers.js';

export const ceilConfig: FieldTransformConfig = {
    name: 'ceil',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Rounds a number up to the next largest integer',
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
            output: 1
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
        return runMathFn(Math.ceil);
    },
    /**
     * `ceil()` inside the `Integer` range, the UDF outside it.
     *
     * `output_type` makes the result an `Integer`, and past that range the UDF path returns a wrapped
     * BIGINT rendered as a STRING - `"3875820019684212735"` for `1e21` - where plain SQL returns the
     * true value. SQL is the better answer there, but changing it is still a behaviour change, so the
     * guard keeps the UDF for magnitudes no real dataset holds and takes the native path for
     * everything else. `docs/known-defects.md` DF2 is the underlying defect.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `${withinIntegerRange(value, `ceil(${value})`)}`
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
