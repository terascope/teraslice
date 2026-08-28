import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const sinhConfig: FieldTransformConfig = {
    name: 'sinh',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the hyperbolic sine of the input, that can be expressed using the constant e',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 0,
            output: 0
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: 1,
            output: 1.1752011936438014
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -1,
            output: -1.1752011936438014
        }
    ],
    create() {
        return runMathFn(Math.sinh);
    },
    /** `sinh` is native; an overflow becomes null through the finiteness guard. */
    sql: {
        // transcendental: DuckDB's libm and V8 differ in the last bit, which IEEE 754
        // permits. The gate compares these to a few ULP - see `approximate`.
        approximate: true,
        expression: ({ value }) => finiteOrNull(`sinh(${value})`),
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
