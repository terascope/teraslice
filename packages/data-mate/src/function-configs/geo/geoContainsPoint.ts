import { geoContainsPointFP, isGeoPoint } from '@terascope/utils';
import { FieldType, GeoPointInput, GeoShapeType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces';

export interface GeoContainsPointArgs {
    point: GeoPointInput;
}

const examples: FunctionDefinitionExample<GeoContainsPointArgs>[] = [
    {
        args: { point: '15, 15' },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
            ]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
            ]
        },
    },
    {
        args: { point: '15, 15' },
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
    {
        args: { point: '15, 15' },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
            ]
        },
        output: null
    },
    {
        args: { point: '15, 15' },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
            ]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
            ]
        },
        description: 'this verifies that point is within a polygon with holes '
    },
    {
        args: { point: '15, 15' },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Point,
            coordinates: [15, 15]
        },
        output: {
            type: GeoShapeType.Point,
            coordinates: [15, 15]
        },
        description: 'this verifies that point can match against a geo-shape point '
    },
];

export const geoContainsPointConfig: FieldValidateConfig<GeoContainsPointArgs> = {
    name: 'geoContainsPoint',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Checks to see if a geo input contains the given point',
    create({ point }) {
        return geoContainsPointFP(point);
    },
    accepts: [FieldType.GeoJSON],
    argument_schema: {
        point: {
            type: FieldType.Any,
            description: 'The point used to see if it is within the given geo-shape, if geo-shape is a point, it checks if they are the same'
        }
    },
    required_arguments: ['point'],
    validate_arguments({ point }) {
        if (!isGeoPoint(point)) {
            throw new Error(`Invalid parameter point: ${point}, is not a valid geo-point`);
        }
    }
};
