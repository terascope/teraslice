import { toPascalCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const toPascalCaseConfig: FieldTransformConfig = {
    name: 'toPascalCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a single word joined with each starting character capitalized',
    create() {
        // toPascalCase handles cases input is not string
        return (input: unknown) => toPascalCase(input as string);
    },
    accepts: [FieldType.String]
};
