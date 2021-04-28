import { getTypeOf, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

function _toUpperCase(input: unknown): string {
    if (!isString(input)) {
        throw new Error(`Invalid input ${JSON.stringify(input)}, expected string got ${getTypeOf(input)}`);
    }
    return input.toUpperCase();
}

export const toUpperCaseConfig: FieldTransformConfig = {
    name: 'toUpperCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a string to upper case characters',
    create() {
        return _toUpperCase;
    },
    accepts: [FieldType.String],
};
