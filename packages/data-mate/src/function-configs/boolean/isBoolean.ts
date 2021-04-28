import { isBoolean } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isBooleanConfig: FieldValidateConfig = {
    name: 'isBoolean',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.BOOLEAN,
    description: 'Checks to see if input is a boolean',
    create() {
        return isBoolean;
    },
    accepts: [],
};
