import { isISDN } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isISDNConfig: FieldValidateConfig = {
    name: 'isISDN',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid phone number, required international prefix to be accurate',
    create() {
        return isISDN;
    },
    accepts: [],
};
