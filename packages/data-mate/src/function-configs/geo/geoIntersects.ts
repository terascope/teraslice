import { geoIntersectsFP, toGeoJSON } from '@terascope/utils';
import { FieldType, GeoInput, GeoShapeType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces';

export interface GeoIntersectsArgs {
    value: GeoInput;
}

const examples: FunctionDefinitionExample<GeoIntersectsArgs>[] = [
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        output: {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
    },
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
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
            value: {
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

export const geoIntersectsConfig: FieldValidateConfig<GeoIntersectsArgs> = {
    name: 'geoIntersects',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Validates that geo-like data when compared to the argument has overlap between the two',
    create({ args: { value } }) {
        return geoIntersectsFP(value);
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
            description: 'The geo input used to validate intersection with other geo-like data'
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
