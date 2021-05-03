import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const absConfig: FieldTransformConfig = {
    name: 'abs',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the absolute value of a number. That is, it returns x if x is positive or zero, and the negation of x if x is negative',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: -1,
            output: 1
        }
    ],
    create() {
        return abs;
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};

function abs(num: unknown): number {
    return Math.abs(toFloatOrThrow(num));
}
