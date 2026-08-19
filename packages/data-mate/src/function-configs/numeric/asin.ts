import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull, inDomain } from '../sql-helpers.js';
import { runMathFn } from './utils.js';

export const asinConfig: FieldTransformConfig = {
    name: 'asin',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the arcsine (in radians) of the given number if it\'s between -1 and 1',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 1,
            output: 1.5707963267948966
        }
    ],
    create() {
        return runMathFn(Math.asin);
    },
    /**
     * `asin`, with its domain checked first.
     *
     * `Math.asin` outside [-1, 1] is NaN -> null; DuckDB raises instead, so the domain is checked first.
    */
    sql: {
        // transcendental: DuckDB's libm and V8 differ in the last bit, which IEEE 754
        // permits. The gate compares these to a few ULP - see `approximate`.
        approximate: true,
        expression: ({ value }) => finiteOrNull(inDomain(`abs(${value}) <= 1`, `asin(${value})`)),
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
