import { isMimeType } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export const isMimeTypeConfig: FieldValidateConfig = {
    name: 'isMimeType',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a MIME Type',
    create() { return isMimeType; },
    accepts: [],
};
