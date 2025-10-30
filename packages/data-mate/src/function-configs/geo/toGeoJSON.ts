import { isNil } from '@terascope/core-utils';
import { toGeoJSONOrThrow } from '@terascope/geo-utils';
import { FieldType, GeoShapeType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const toGeoJSONConfig: FieldTransformConfig = {
    name: 'toGeoJSON',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '60,40',
            output: {
                type: GeoShapeType.Point,
                coordinates: [40, 60]
            }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String, array: true } } },
            field: 'testField',
            input: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            output: {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
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
    description: 'Converts a geo-point or a list of geo-points to geoJSON. Only supports geoJSON points or simple polygons, there is currently no support for multi-polygons or polygons/ multipolygons with holes',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;
            return toGeoJSONOrThrow(input as any);
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Object,
        FieldType.GeoPoint,
        FieldType.Geo,
        FieldType.Number,
        FieldType.GeoJSON
    ],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.GeoJSON,
                array: false
            },
        };
    }
};
