import { isMIMEType } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export const isMIMETypeConfig: FieldValidateConfig = {
    name: 'isMIMEType',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a valid Media or MIME Type, used by browsers to determine how to process a URL',
    create() { return isMIMEType; },
    accepts: [FieldType.String],
};
