import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';
import { runMathFn } from './utils';

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
            output: 'Expected value greater than 0, got 0'
        }
    ],
    create() {
        return runMathFn(Math.acosh, (num) => {
            if (num > 0) return;
            throw new TypeError(`Expected value greater than 0, got ${num}`);
        });
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
