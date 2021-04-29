import { isPort } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isPortConfig: FieldValidateConfig = {
    name: 'isPort',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid port',
    create() { return isPort; },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
};
