import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isOddConfig: FieldValidateConfig = {
    name: 'isOdd',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the input if it is an odd number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 100,
            output: null
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 99,
            output: 99
        }
    ],
    create() {
        return isOdd;
    },
    /**
     * `mod(x, 2) = 1`, and the `= 1` is deliberate rather than `abs(...) = 1`.
     *
     * `isOdd(-3)` is **false** in data-mate - the implementation compares `x % 2 === 1` and `-3 % 2` is
     * `-1` - so SQL has to make the same asymmetric comparison to agree. Verified against the
     * implementation, not assumed.
    */
    sql: {
        expression: ({ value }) => `mod(${value}, 2) = 1`,
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    required_arguments: []
};

function isOdd(value: unknown) {
    return (value as number) % 2 === 1;
}
