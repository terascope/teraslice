import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const expm1Config: FieldTransformConfig = {
    name: 'expm1',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns a number representing `e^x - 1`, where `e` is Euler\'s number and `x` is the argument.',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 0,
            output: 0
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 1,
            output: 1.718281828459045
        }
    ],
    create() {
        return expm1;
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Float
            }
        };
    }
};

function expm1(num: unknown): number|null {
    const value = Math.expm1(toFloatOrThrow(num));
    if (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY) {
        return null;
    }
    return value;
}
