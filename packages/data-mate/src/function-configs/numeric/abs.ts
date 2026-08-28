import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const absConfig: FieldTransformConfig = {
    name: 'abs',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the absolute value of a number.',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: -1,
            output: 1
        }
    ],
    create() {
        return runMathFn(Math.abs);
    },
    /** `abs` is native, and `runMathFn`'s non-finite-to-null guard is kept. */
    sql: {
        expression: ({ value }) => finiteOrNull(`abs(${value})`),
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
