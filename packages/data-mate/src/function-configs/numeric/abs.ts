import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';
import { runMathFn } from './utils';

export const absConfig: FieldTransformConfig = {
    name: 'abs',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the absolute value of a number.',
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
        return runMathFn(Math.abs);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
