import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { runMathFn } from './utils.js';

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
     * NOT promoted to SQL, and the reason is a defect on the UDF side rather than in the SQL.
     *
     * `output_type` makes the result an `Integer`, and at `1e21` the JavaScript UDF path returns
     * garbage - the parity gate recorded `"3875820019684212735"` (a wrapped BIGINT, rendered as a
     * STRING) where the SQL expression returns the mathematically correct `1e+21`. SQL is the better
     * answer, but promoting it would still be a behaviour CHANGE, and the two cannot be made equal
     * while the UDF path is wrong. `-0` differs too: SQL preserves it, the UDF path normalises it
     * to `0`.
     *
     * Fix the overflow first (what does `DataFrame` return at `1e21`?), then promote.
    */
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
