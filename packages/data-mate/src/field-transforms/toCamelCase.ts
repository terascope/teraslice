import { toCamelCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType
} from '../interfaces';

export const toCamelCaseConfig: FieldTransformConfig = {
    name: 'toCamelCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a string to camel case characters',
    create() {
        // toCamelCase handles cases input is not string
        return (input: unknown) => toCamelCase(input as string);
    },
    accepts: [FieldType.String],
};
