import { isMIMEType } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export const isMIMETypeConfig: FieldValidateConfig = {
    name: 'isMIMEType',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a valid Media or MIME (Multipurpose Internet Mail Extensions) Type ',
    create() { return isMIMEType; },
    accepts: [FieldType.String],
};
