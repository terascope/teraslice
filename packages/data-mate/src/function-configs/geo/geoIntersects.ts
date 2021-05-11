import { geoIntersectsFP, toGeoJSON } from '@terascope/utils';
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
        args: { geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [20, 20]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [20, 20]
        },
    },
    {
        args: { geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
        },
    },
    {
        args: {
            geoInput: {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
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
];

export const geoIntersectsConfig: FieldValidateConfig<GeoContainsArgs> = {
    name: 'geoIntersects',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Validates that geo-like data "intersects" the geoInput argument',
    create({ geoInput }) {
        return geoIntersectsFP(geoInput);
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
            description: 'The geo input used to compare to other geo entities'
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
