import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

function _toLowerCase(input: unknown): string {
    return String(input).toLowerCase();
}

export const toLowerCaseConfig: FieldTransformConfig = {
    name: 'toLowerCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a string to lower case characters',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'HELLO there',
            output: 'hello there'
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'biLLy',
            output: 'billy',
        }
    ],
    create() {
        return _toLowerCase;
    },
    accepts: [FieldType.String]
};
