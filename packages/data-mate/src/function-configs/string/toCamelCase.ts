import { toCamelCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const toCamelCaseConfig: FieldTransformConfig = {
    name: 'toCamelCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase',
    create() {
        // toCamelCase handles cases input is not string
        return (input: unknown) => toCamelCase(input as string);
    },
    accepts: [FieldType.String],
};
