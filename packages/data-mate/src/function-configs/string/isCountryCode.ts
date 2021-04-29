import { isCountryCode } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export const isCountryCodeConfig: FieldValidateConfig = {
    name: 'isCountryCode',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid ISO 3166-1 alpha-2 country code',
    create() { return isCountryCode; },
    accepts: [
        FieldType.String
    ],
};
