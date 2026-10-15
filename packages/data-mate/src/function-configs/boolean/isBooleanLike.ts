import { isBooleanLike } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import {
    isBooleanColumn, isStringColumn, stringIsFalsy, stringIsTruthy, isNumericColumn,
} from './sql-utils.js';

export const isBooleanLikeConfig: FieldValidateConfig = {
    name: 'isBooleanLike',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.BOOLEAN,
    description: 'Returns the input if it can be converted to a boolean, otherwise returns null',
    examples: [{
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'TRUE',
        output: 'TRUE'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'false',
        output: 'false'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 1,
        output: 1
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102,
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: 'example',
        output: null
    }],
    create() {
        return isBooleanLike;
    },
    /**
     * `isFalsy(x) || isTruthy(x)`, expressed per column type.
     *
     * A boolean always qualifies. A number qualifies when it is 0 or 1. A string qualifies when it
     * is empty, or when it trims and lowercases to one of the truthy or falsy keys. Other column
     * types keep the UDF.
    */
    sql: {
        applies: (_args, inputConfig) => isBooleanColumn(inputConfig)
            || isStringColumn(inputConfig)
            || isNumericColumn(inputConfig),
        expression: ({ value, inputConfig }) => {
            if (isBooleanColumn(inputConfig)) return 'TRUE';
            if (isStringColumn(inputConfig)) {
                return `(${stringIsFalsy(value)} OR ${stringIsTruthy(value)})`;
            }
            return `${value} IN (0, 1)`;
        },
    },
    accepts: [],
};
