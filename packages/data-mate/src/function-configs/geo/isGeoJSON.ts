import { isGeoJSON } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionCategory,
    FunctionDefinitionType
} from '../interfaces';

export const isGeoJSONConfig: FieldValidateConfig = {
    name: 'isGeoJSON',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Checks if value is a GeoJSON object',
    create() {
        return isGeoJSON;
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ]
};
