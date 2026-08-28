import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isEvenConfig: FieldValidateConfig = {
    name: 'isEven',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the input if it is an even number.',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 100,
            output: 100
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 99,
            output: null
        }
    ],
    create() {
        return isEven;
    },
    /** `mod(x, 2) = 0`, which is false for a fraction on both sides - `isEven(4.5)` is false. */
    sql: {
        expression: ({ value }) => `mod(${value}, 2) = 0`,
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    required_arguments: []
};

function isEven(value: unknown) {
    return (value as number) % 2 === 0;
}
