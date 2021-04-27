import { toTitleCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
} from '../interfaces';

export const toTitleCaseConfig: FieldTransformConfig = {
    name: 'toTitleCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a string to snake case characters',
    create() {
        // toTitleCase handles cases input is not string
        return (input: unknown) => toTitleCase(input as string);
    },
    accepts: [FieldType.String],
};
