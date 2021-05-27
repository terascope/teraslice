import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';
import { runMathFn } from './utils';

export const signConfig: FieldTransformConfig = {
    name: 'sign',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: `Returns a number representing the sign of the input value:
- If the argument is positive, returns 1
- If the argument is negative, returns -1
- If the argument is positive zero, returns 0
- If the argument is negative zero, returns -0
- Otherwise, null is returned`,
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 3,
            output: 1
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: -3,
            output: -1
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0,
            output: 0
        }
    ],
    create() {
        return runMathFn(Math.sign);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                type: FieldType.Byte
            }
        };
    }
};
