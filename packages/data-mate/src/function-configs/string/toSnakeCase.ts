import { toSnakeCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const toSnakeCaseConfig: FieldTransformConfig = {
    name: 'toSnakeCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a single word joined by underscores',
    create() {
        // toSnakeCase handles cases input is not string
        return (input: unknown) => toSnakeCase(input as string);
    },
    accepts: [FieldType.String],
};
