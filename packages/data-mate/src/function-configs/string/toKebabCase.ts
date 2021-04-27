import { toKebabCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
} from '../interfaces';

export const toKebabCaseConfig: FieldTransformConfig = {
    name: 'toKebabCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a string to kebab case characters',
    create() {
        // toKebabCase handles cases input is not string
        return (input: unknown) => toKebabCase(input as string);
    },
    accepts: [FieldType.String]
};
