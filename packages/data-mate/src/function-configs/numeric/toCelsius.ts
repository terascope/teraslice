import {
    toCelsius
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';

export const toCelsiusConfig: FieldTransformConfig = {
    name: 'toCelsius',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the equivalent celsius value from the fahrenheit input.',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 32,
            output: 0
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 69.8,
            output: 21
        }
    ],
    create() {
        return toCelsius;
    },
    /**
     * F to C, **rounded to two decimals**, which the implementation does and the formula alone does not:
     * `toCelsius(100)` is `37.78`, not `37.777777777777779`.
     *
     * `floor(v * 100 + 0.5) / 100` rather than `round(v, 2)`, because `Math.round` breaks ties toward
     * +infinity and SQL's `round` breaks them away from zero.
    */
    sql: {
        expression: ({ value }) => {
            const converted = `((${value} - 32) * 5 / 9)`;
            return finiteOrNull(`floor(${converted} * 100 + 0.5) / 100`);
        },
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
