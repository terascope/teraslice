import { isGeoJSON } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export const isGeoJSONConfig: FieldTransformConfig = {
    name: 'isGeoJSON',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Checks if value is a GeoJSON object',
    create() {
        return isGeoJSON;
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.GeoJSON,
            },
        };
    }
};
