import { isPhoneNumberLike } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isPhoneNumberLikeConfig: FieldValidateConfig = {
    name: 'isPhoneNumberLike',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input looks like a phone number',
    create() {
        return isPhoneNumberLike;
    },
    accepts: [],
};
