import { geoContainsFP, toGeoJSON } from '@terascope/core-utils';
import { FieldType, GeoShapeType, GeoInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample,
} from '../interfaces.js';

export interface GeoContainsArgs {
    value: GeoInput;
}

const examples: FunctionDefinitionExample<GeoContainsArgs>[] = [
    {
        args: { value: '33.435518,-111.873616' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '33.435518,-111.873616',
        output: '33.435518,-111.873616',
    },
    {
        args: { value: { type: GeoShapeType.Point, coordinates: [-111.873616, 33.435518] } },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '45.518,-21.816',
        output: null,
    },
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
    },
    {
        args: {
            value: {
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
        },
    },
    {
        args: {
            value: {
                type: GeoShapeType.Point,
                coordinates: [-30, -30]
            }
        },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                ],
                [
                    [[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]],
                ]
            ]
        },
        output: null,
    },
];

export const geoContainsConfig: FieldValidateConfig<GeoContainsArgs> = {
    name: 'geoContains',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Returns the input if it contains the value argument, otherwise returns null. The interiors of both geo entities must intersect, and the argument geo-entity must not exceed the bounds of the input geo-entity',
    create({ args: { value } }) {
        return geoContainsFP(value);
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Geo,
        FieldType.Object,
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        value: {
            type: FieldType.Any,
            description: 'The geo value used to check if it is contained by the input'
        }
    },
    required_arguments: ['value'],
    validate_arguments({ value }) {
        const input = toGeoJSON(value);
        if (!input) {
            throw new Error(`Invalid parameter value: ${JSON.stringify(value)}, is not a valid geo-json`);
        }
    }
};
