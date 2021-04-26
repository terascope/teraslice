import {
    trim, isNotNil, isString, getTypeOf
} from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType
} from '../interfaces';

export interface TrimArgs {
    chars?: string;
}

export const trimConfig: FieldTransformConfig<TrimArgs> = {
    name: 'trim',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Trims whitespace or characters from string',
    create({ chars } = {}) {
        return (input: unknown) => trim(input, chars);
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
