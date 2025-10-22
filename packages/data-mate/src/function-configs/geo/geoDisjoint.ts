import { geoDisjointFP, toGeoJSON } from '@terascope/core-utils';
import { FieldType, GeoShapeType, GeoInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

export interface GeoDisjointArgs {
    value: GeoInput;
}

const examples: FunctionDefinitionExample<GeoDisjointArgs>[] = [
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '-33.435967,-111.867710',
        output: '-33.435967,-111.867710',
    },
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        output: null
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
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
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
        output: null,
    },
];

export const geoDisjointConfig: FieldValidateConfig<GeoDisjointArgs> = {
    name: 'geoDisjoint',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Returns the input if it does not have any intersection (overlap) with the argument value, otherwise returns null',
    create({ args: { value } }) {
        return geoDisjointFP(value);
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
            description: 'The geo value used to validate that no intersection exists with the input geo-entity'
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
