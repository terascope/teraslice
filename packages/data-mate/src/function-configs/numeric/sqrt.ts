import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull, inDomain } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const sqrtConfig: FieldTransformConfig = {
    name: 'sqrt',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the square root of the input',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 9,
            output: 3
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: 2,
            output: 1.4142135623730951
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -1,
            output: null
        }
    ],
    create() {
        return runMathFn(Math.sqrt);
    },
    /**
     * `sqrt`, with its domain checked first.
     *
     * `sqrt(-1)` THROWS in DuckDB (`Out of Range Error`) where `Math.sqrt(-1)` is NaN, which
     * `runMathFn` turns into null. The guard is what stops an out-of-domain value aborting the query.
    */
    sql: {
        expression: ({ value }) => finiteOrNull(inDomain(`${value} >= 0`, `sqrt(${value})`)),
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
