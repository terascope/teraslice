import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const atanhConfig: FieldTransformConfig = {
    name: 'atanh',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the arctangent (in radians) of the given number',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0.5,
            output: 0.5493061443340548
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: -1,
            output: null,
            description: 'Typically this would return -Infinity but that cannot be stored or serialized so null is returned'
        }
    ],
    create() {
        return atanh;
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            }
        };
    }
};

function atanh(num: unknown): number|null {
    const value = Math.atanh(toFloatOrThrow(num));
    if (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY) {
        return null;
    }
    return value;
}
