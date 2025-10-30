import { geoWithinFP, toGeoJSON } from '@terascope/geo-utils';
import { FieldType, GeoShapeType, GeoInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

export interface GeoWithinArgs {
    value: GeoInput;
}

const examples: FunctionDefinitionExample<GeoWithinArgs>[] = [
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
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: '20,20',
    },
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
        },
        output: {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
        }
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
        }
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
        }
    },
];

export const geoWithinConfig: FieldValidateConfig<GeoWithinArgs> = {
    name: 'geoWithin',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Returns the input if it is completely within the argument geo-value. The interiors of both geo entities must intersect and the geo data must not exceed the bounds of the geo argument.  Otherwise returns null',
    create({ args: { value } }) {
        return geoWithinFP(value);
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
            description: 'The geo value used to compare the input value to.'
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
