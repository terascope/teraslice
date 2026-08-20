import { geoContainsFP, isGeoPoint } from '@terascope/geo-utils';
import { FieldType, GeoShapeType, GeoPointInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';
import {
    isGeoColumn, isGeoArg, asGeometry, constantGeometry, tryPredicate,
} from './sql-utils.js';

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
        description: 'point is within a polygon with holes '
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
        description: 'point can match against a geo-shape point '
    },
];

export const geoContainsPointConfig: FieldValidateConfig<GeoContainsPointArgs> = {
    name: 'geoContainsPoint',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Returns the input if it contains the geo-point, otherwise returns null',
    create({ args: { point } }) {
        return geoContainsFP(point);
    },
    /**
     * `ST_Contains(shape, point)` - the column is the shape and the argument is the point.
     *
     * Diverges from `geoContains` for a point exactly ON a hole's edge: `geo-utils` calls it
     * contained, `ST_Contains` does not, because such a point is on the polygon's boundary. SQL is
     * right. See known-defects DF8.
    */
    sql: {
        applies: (args, inputConfig) => isGeoColumn(inputConfig) && isGeoArg(args.point),
        expression: ({ value, args, inputConfig }) => tryPredicate(
            `ST_Contains(${asGeometry(value, inputConfig)}, ${constantGeometry(args.point)})`
        ),
    },
    accepts: [FieldType.GeoJSON],
    argument_schema: {
        point: {
            type: FieldType.Any,
            description: 'The point used to see if it is within the input geo-shape. If the input geo-shape is a point, it checks if they are the same'
        }
    },
    required_arguments: ['point'],
    validate_arguments({ point }) {
        if (!isGeoPoint(point)) {
            throw new Error(`Invalid parameter point: ${point}, is not a valid geo-point`);
        }
    }
};
