import { toPascalCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,

} from '../interfaces';

export const toPascalCaseConfig: FieldTransformConfig = {
    name: 'toPascalCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a string to pascal case characters',
    create() {
        // toPascalCase handles cases input is not string
        return (input: unknown) => toPascalCase(input as string);
    },
    accepts: [FieldType.String]
};
