import { isString } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isStringConfig: FieldValidateConfig = {
    name: 'isString',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a string',
    create() {
        return isString;
    },
    accepts: [],
};
