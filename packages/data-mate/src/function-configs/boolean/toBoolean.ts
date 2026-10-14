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
     * `isFalsy(x) ? false : isTruthy(x) ? true : Boolean(x)`, simplified per column type.
     *
     * For a string this reduces to "not falsy": a non-empty string that is not a falsy key is true
     * either way. For a number, `Boolean(x)` is false only for zero and `NaN`, and `'0'` is already
     * a falsy key, so the result is `x <> 0 AND NOT isnan(x)`.
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
