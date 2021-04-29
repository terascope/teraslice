import { isISDN, isCountryCode } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface ISDNCountry {
    country?: string;
}

export const isISDNConfig: FieldValidateConfig = {
    name: 'isISDN',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid phone number.  If the country arg is not provided then it is processed as an international formatted phone number',
    create({ country }: ISDNCountry) {
        return (input: unknown) => isISDN(input, country);
    },
    accepts: [
        FieldType.String,
        FieldType.Number
    ],
    required_arguments: [],
    validate_arguments({ country }) {
        if (country != null && !isCountryCode(country)) {
            throw new Error('Invalid country, the country must be a ISO 3166-1 alpha-2 officially assigned country code');
        }
    }
};
