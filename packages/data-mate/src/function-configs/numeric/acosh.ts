import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const acoshConfig: FieldTransformConfig = {
    name: 'acosh',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the hyperbolic arc-cosine of a given number. If given a number less than 1, it will throw.',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 1,
            output: 0
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0,
            fails: true,
            output: 'Expected value greater than or equal to 0, got 0'
        }
    ],
    create() {
        return acosh;
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};

function acosh(num: unknown): number {
    const float = toFloatOrThrow(num);
    if (float < 1) {
        throw new TypeError(`Expected value greater than or equal to 0, got ${float}`);
    }
    return Math.acosh(float);
}
