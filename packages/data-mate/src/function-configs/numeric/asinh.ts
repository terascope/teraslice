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
    description: 'The hyperbolic arcsine of the given number.',
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
};

function asinh(num: unknown): number {
    return Math.asinh(toFloatOrThrow(num));
}
