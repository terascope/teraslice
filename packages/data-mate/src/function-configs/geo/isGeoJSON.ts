import { isGeoJSON } from '@terascope/core-utils';
import { FieldType, GeoShapeType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionCategory,
    FunctionDefinitionType
} from '../interfaces.js';

export const isGeoJSONConfig: FieldValidateConfig = {
    name: 'isGeoJSON',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Returns the input if it is a GeoJSON object, otherwise returns null',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '60,40',
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoPoint } } },
            field: 'testField',
            input: { lat: 60, lon: 40 },
            output: null
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: GeoShapeType.Point, coordinates: [12, 12] },
            output: { type: GeoShapeType.Point, coordinates: [12, 12] }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
            },
            output: {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
            }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: {
                type: GeoShapeType.MultiPolygon,
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
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                    ]
                ]
            }
        },

    ],
    create() {
        return isGeoJSON;
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ]
};
