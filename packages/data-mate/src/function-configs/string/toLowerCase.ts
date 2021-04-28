import { getTypeOf, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

function _toLowerCase(input: unknown): string {
    if (!isString(input)) {
        throw new Error(`Invalid input ${JSON.stringify(input)}, expected string got ${getTypeOf(input)}`);
    }
    return input.toLowerCase();
}

export const toLowerCaseConfig: FieldTransformConfig = {
    name: 'toLowerCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a string to lower case characters',
    create() {
        return _toLowerCase;
    },
    accepts: [FieldType.String]
};
