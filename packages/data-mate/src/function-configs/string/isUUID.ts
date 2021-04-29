import { isUUID } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isUUIDConfig: FieldValidateConfig = {
    name: 'isUUID',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a UUID',
    create() { return isUUID; },
    accepts: [
        FieldType.String
    ],
};
