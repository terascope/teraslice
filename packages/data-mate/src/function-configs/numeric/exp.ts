import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const expConfig: FieldTransformConfig = {
    name: 'exp',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns a number representing `e^x`, where `e` is Euler\'s number and `x` is the argument',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 0,
            output: 1
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 1,
            output: 2.718281828459045
        }
    ],
    create() {
        return exp;
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

function exp(num: unknown): number|null {
    const value = Math.exp(toFloatOrThrow(num));
    if (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY) {
        return null;
    }
    return value;
}
