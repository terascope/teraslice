import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const froundConfig: FieldTransformConfig = {
    name: 'fround',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the nearest 32-bit single precision float representation of the given number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 5.5,
            output: 5.5
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -5.05,
            output: -5.050000190734863
        },
    ],
    create() {
        return runMathFn(Math.fround);
    },
    /** `Math.fround` is a round trip through a 32-bit float, which is exactly a `FLOAT` cast. */
    sql: {
        expression: ({ value }) => finiteOrNull(`CAST(${value} AS FLOAT)::DOUBLE`),
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
