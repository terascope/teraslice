import { geoContainsFP, toGeoJSON } from '@terascope/utils';
import { FieldType, GeoInput, GeoShapeType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces';

export interface GeoContainsArgs {
    geoInput: GeoInput;
}

const examples: FunctionDefinitionExample<GeoContainsArgs>[] = [
    {
        args: { geoInput: '33.435518,-111.873616' },
        config: { version: 1, fields: { testField: { type: FieldType.GeoPoint } } },
        field: 'testField',
        input: '33.435518,-111.873616',
        output: '33.435518,-111.873616',
    },
    {
        args: { geoInput: { type: GeoShapeType.Point, coordinates: [-111.873616, 33.435518] } },
        config: { version: 1, fields: { testField: { type: FieldType.GeoPoint } } },
        field: 'testField',
        input: '45.518,-21.816',
        output: null,
    },
    {
        args: { geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
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
            geoInput: {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [
                        [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                    ],
                    [
                        [[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]],
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
            geoInput: {
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
        output: {
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
    },
];

export const geoContainsConfig: FieldValidateConfig<GeoContainsArgs> = {
    name: 'geoContains',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Validates that geo-like data "contains" the geoInput argument',
    create({ geoInput }) {
        return geoContainsFP(geoInput);
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Object,
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        geoInput: {
            type: FieldType.Any,
            description: 'The geo input that must be "contained" for the validation to return true'
        }
    },
    required_arguments: ['geoInput'],
    validate_arguments({ geoInput }) {
        const input = toGeoJSON(geoInput);
        if (!input) {
            throw new Error(`Invalid parameter geoInput: ${JSON.stringify(geoInput)}, is not a valid geo-json`);
        }
    }
};
