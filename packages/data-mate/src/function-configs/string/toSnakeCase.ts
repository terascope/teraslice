import { toSnakeCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
} from '../interfaces';

export const toSnakeCaseConfig: FieldTransformConfig = {
    name: 'toSnakeCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a string to snake case characters',
    create() {
        // toSnakeCase handles cases input is not string
        return (input: unknown) => toSnakeCase(input as string);
    },
    accepts: [FieldType.String],
};
