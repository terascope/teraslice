import {
    toFahrenheit
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { finiteOrNull } from '../sql-helpers.js';

export const toFahrenheitConfig: FieldTransformConfig = {
    name: 'toFahrenheit',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the equivalent fahrenheit value from the celsius input.',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0,
            output: 32
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 22,
            output: 71.6
        }
    ],
    create() {
        return toFahrenheit;
    },
    /**
     * C to F, **rounded to two decimals**, which the implementation does and the formula alone does not:
     * `toCelsius(100)` is `37.78`, not `37.777777777777779`.
     *
     * `floor(v * 100 + 0.5) / 100` rather than `round(v, 2)`, because `Math.round` breaks ties toward
     * +infinity and SQL's `round` breaks them away from zero.
    */
    sql: {
        expression: ({ value }) => {
            const converted = `((${value} * 9 / 5) + 32)`;
            return finiteOrNull(`floor(${converted} * 100 + 0.5) / 100`);
        },
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
