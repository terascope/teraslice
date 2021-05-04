import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const asinhConfig: FieldTransformConfig = {
    name: 'asinh',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the hyperbolic arcsine of the given number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 1,
            output: 0.881373587019543
        }
    ],
    create() {
        return asinh;
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

function asinh(num: unknown): number|null {
    const value = Math.asinh(toFloatOrThrow(num));
    if (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY) {
        return null;
    }
    return value;
}
