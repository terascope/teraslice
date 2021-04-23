import { trimEnd } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
} from '../interfaces';

export interface TrimEndArgs {
    chars?: string;
}

export const trimEndConfig: FieldTransformConfig<TrimEndArgs> = {
    name: 'trimEnd',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Trims whitespace or characters from end of string',
    create({ chars } = {}) {
        return (input: unknown) => trimEnd(input, chars);
    },
    accepts: [FieldType.String],
    argument_schema: {
        chars: {
            type: FieldType.String,
            array: false,
            description: 'The characters to remove, defaults to whitespace'
        }
    },
};
