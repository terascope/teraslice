import { getTypeOf, isString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

function _reverse(input: unknown): string|null {
    if (!isString(input)) {
        throw new Error(`Invalid input ${JSON.stringify(input)}, expected string got ${getTypeOf(input)}`);
    }

    if (input.length === 0) return null;

    let results = '';

    for (let i = input.length - 1; i >= 0; i--) {
        results += input[i];
    }

    return results;
}

export const reverseConfig: FieldTransformConfig = {
    name: 'reverse',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'reverses the string value',
    create() {
        return _reverse;
    },
    accepts: [FieldType.String],
};
