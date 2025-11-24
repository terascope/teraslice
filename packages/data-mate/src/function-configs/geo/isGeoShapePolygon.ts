import { isGeoShapePolygon } from '@terascope/geo-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const isGeoShapePolygonConfig: FieldValidateConfig = {
    name: 'isGeoShapePolygon',
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
            output: { type: 'Polygon', coordinates: [[[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]]] },
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
            output: null,
        }
    ],
    description: 'Return the input if it is a valid geo-json polygon, otherwise returns null',
    create() {
        return isGeoShapePolygon;
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ]
};
