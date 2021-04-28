import { toTitleCase } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export const toTitleCaseConfig: FieldTransformConfig = {
    name: 'toTitleCase',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts one or more words into a whitespace separated word with each word starting with a capital letter',
    create() {
        // toTitleCase handles cases input is not string
        return (input: unknown) => toTitleCase(input as string);
    },
    accepts: [FieldType.String],
};
