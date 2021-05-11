import {
    joinList, geoRelationFP, toGeoJSON
} from '@terascope/utils';
import {
    FieldType, GeoShapeRelation, GeoInput, GeoShapeType
} from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces';

export interface GeoPolygonArgs {
    geoInput: GeoInput;
    relation?: GeoShapeRelation
}

const examples: FunctionDefinitionExample<GeoPolygonArgs>[] = [
    {
        args: { geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: '20,20',
    },
    {
        args: {
            geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            relation: GeoShapeRelation.Within
        },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: '20,20',
    },
    {
        args: {
            geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            relation: GeoShapeRelation.Contains
        },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: null,
    },
    {
        args: {
            geoInput: {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
            },
            relation: GeoShapeRelation.Disjoint
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
            geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            relation: GeoShapeRelation.Intersects
        },
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
            geoInput: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            relation: GeoShapeRelation.Disjoint
        },
        config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
        field: 'testField',
        input: {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
        },
        output: null,
    },
];

export const geoRelationConfig: FieldValidateConfig<GeoPolygonArgs> = {
    name: 'geoRelation',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: `Compares geo inputs to any geo-like data based off the relation specified (defaults to "${GeoShapeRelation.Within}"`,
    create({ geoInput, relation = GeoShapeRelation.Within }) {
        return geoRelationFP(geoInput, relation);
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
        },
        relation: {
            type: FieldType.String,
            description: `How the geo input should relate the data, defaults to "within" : ${joinList(Object.values(GeoShapeRelation), ', ')}
            `.trim()
        }
    },
    required_arguments: ['geoInput'],
    validate_arguments({ geoInput, relation }) {
        const input = toGeoJSON(geoInput);

        if (!input) {
            throw new Error(`Invalid parameter geoInput: ${JSON.stringify(geoInput)}, is not a valid geo-json`);
        }

        if (relation) {
            const vals = Object.values(GeoShapeRelation);
            if (!vals.includes(relation)) {
                throw new Error(`Invalid relation: ${relation}, expected to be set to ${joinList(vals, ', ')}`);
            }
        }
    }
};
