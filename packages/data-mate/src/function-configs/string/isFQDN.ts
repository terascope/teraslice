import { isFQDN } from '@terascope/utils';
import { FieldType } from '@terascope/types';

import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isFQDNConfig: FieldValidateConfig = {
    name: 'isFQDN',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a fully qualified domain name',
    create() { return isFQDN; },
    accepts: [
        FieldType.String
    ],
};
