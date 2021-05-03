import { isGeoPoint } from '@terascope/utils';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const isGeoPointConfig: FieldValidateConfig = {
    name: 'isGeoPoint',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Checks if value is parsable to geo-point',
    create() {
        return isGeoPoint;
    },
    accepts: [],
};
