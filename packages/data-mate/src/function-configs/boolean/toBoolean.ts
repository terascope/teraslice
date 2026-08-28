import { toBoolean } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    DataTypeFieldAndChildren, FunctionDefinitionCategory
} from '../interfaces.js';
import {
    isBooleanColumn, isStringColumn, stringIsFalsy, isNumericColumn,
} from './sql-utils.js';

export const toBooleanConfig: FieldTransformConfig = {
    name: 'toBoolean',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.BOOLEAN,
    description: 'Converts the input into a boolean and returns the boolean value',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: 'TRUE',
            output: true
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 1,
            output: true
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 0,
            output: false
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Any } }
            },
            field: 'testField',
            input: null,
            output: null
        }
    ],
    create() {
        return toBoolean;
    },
    /**
     * `isFalsy(x) ? false : isTruthy(x) ? true : Boolean(x)`, collapsed per column type.
     *
     * For a string the three branches reduce to "not falsy": anything that is not in `_falsy` and
     * not empty is either in `_truthy` or a non-empty string, and `Boolean` of a non-empty string
     * is true. For a number, `Boolean(x)` is false only for zero and `NaN`, and `String(0)` is
     * already a `_falsy` key, so the two agree on `x <> 0 AND NOT isnan(x)`.
    */
    sql: {
        applies: (_args, inputConfig) => isBooleanColumn(inputConfig)
            || isStringColumn(inputConfig)
            || isNumericColumn(inputConfig),
        expression: ({ value, inputConfig }) => {
            if (isBooleanColumn(inputConfig)) return value;
            if (isStringColumn(inputConfig)) return `NOT ${stringIsFalsy(value)}`;
            return `(${value} <> 0 AND NOT isnan(${value}))`;
        },
    },
    accepts: [],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Boolean
            },
        };
    }
};
