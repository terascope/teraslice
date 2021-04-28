import {
    isNotNil, isString, trimStart, getTypeOf
} from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface TrimStartArgs {
    chars?: string;
}

export const trimStartConfig: FieldTransformConfig<TrimStartArgs> = {
    name: 'trimStart',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Trims whitespace or characters from start of string',
    create({ chars } = {}) {
        return (input: unknown) => trimStart(input, chars);
    },
    accepts: [FieldType.String],
    argument_schema: {
        chars: {
            type: FieldType.String,
            array: false,
            description: 'The characters to remove, defaults to whitespace'
        }
    },
    validate_arguments({ chars } = {}) {
        if (isNotNil(chars) && !isString(chars)) {
            throw new Error(`Invalid parameter chars, if provided it must be of type string, got ${getTypeOf(chars)}`);
        }
    }
};
