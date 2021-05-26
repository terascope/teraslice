import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

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
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    required_arguments: []
};

function isOdd(value: unknown) {
    return (value as number) % 2 === 1;
}
