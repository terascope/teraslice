import { isGeoShapeMultiPolygon } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const isGeoShapeMultiPolygonConfig: FieldValidateConfig = {
    name: 'isGeoShapeMultiPolygon',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: 'Point', coordinates: [12, 12] },
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: 'Polygon', coordinates: [[[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]]] },
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                    ]
                ]
            },
            output: {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                    ]
                ]
            },
        }
    ],
    description: 'Checks to see if input is a valid geo-json multi-polygon',
    create() {
        return isGeoShapeMultiPolygon;
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ]
};
