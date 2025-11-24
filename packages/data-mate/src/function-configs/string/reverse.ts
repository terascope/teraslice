import { getTypeOf, isString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

function _reverse(input: unknown): string | null {
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

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'hello',
        output: 'olleh'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'more words',
        output: 'sdrow erom',
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String, array: true } } },
        field: 'testField',
        input: ['hello', 'more'],
        output: ['olleh', 'erom']
    },
];

export const reverseConfig: FieldTransformConfig = {
    name: 'reverse',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input string with its characters in reverse order.',
    examples,
    create() {
        return _reverse;
    },
    accepts: [FieldType.String],
};
