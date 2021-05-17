import { isDeepEqual } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface EqualsArgs {
    readonly value: unknown;
}

export const equalsConfig: FieldValidateConfig<EqualsArgs> = {
    name: 'equals',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.OBJECT,
    description: 'Checks to see if input matches the value',
    create({ value }) {
        return (input: unknown) => isDeepEqual(input, value);
    },
    accepts: [],
    argument_schema: {
        value: {
            type: FieldType.Any,
            array: false,
            description: 'Value to use in the comparison'
        }
    }
};
