import {
    joinList, geoRelationFP, toGeoJSON
} from '@terascope/core-utils';
import {
    FieldType, GeoShapeRelation, GeoShapeType, GeoInput
} from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';

export interface GeoRelationArgs {
    value: GeoInput;
    relation?: GeoShapeRelation;
}

const examples: FunctionDefinitionExample<GeoRelationArgs>[] = [
    {
        args: { value: ['10,10', '10,50', '50,50', '50,10', '10,10'] },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: '20,20',
    },
    {
        args: {
            value: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            relation: GeoShapeRelation.Within
        },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: '20,20',
    },
    {
        args: {
            value: ['10,10', '10,50', '50,50', '50,10', '10,10'],
            relation: GeoShapeRelation.Contains
        },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '20,20',
        output: null,
    },
    {
        args: {
            value: {
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
            value: ['10,10', '10,50', '50,50', '50,10', '10,10'],
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
            value: ['10,10', '10,50', '50,50', '50,10', '10,10'],
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

export const geoRelationConfig: FieldValidateConfig<GeoRelationArgs> = {
    name: 'geoRelation',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: `Returns the input if it relates, as specified in the relation argument, to the argument value (defaults to "${GeoShapeRelation.Within}"), otherwise returns null`,
    create({ args: { value, relation = GeoShapeRelation.Within } }) {
        return geoRelationFP(value, relation);
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
            description: 'The geo value used to compare to the input geo-entity'
        },
        relation: {
            type: FieldType.String,
            description: `How the geo input should relate the argument value, defaults to "within" : ${joinList(Object.values(GeoShapeRelation), ', ')}
            `.trim()
        }
    },
    required_arguments: ['value'],
    validate_arguments({ value, relation }) {
        const input = toGeoJSON(value);

        if (!input) {
            throw new Error(`Invalid parameter value: ${JSON.stringify(value)}, is not a valid geo-json`);
        }

        if (relation) {
            const vals = Object.values(GeoShapeRelation);
            if (!vals.includes(relation)) {
                throw new Error(`Invalid relation: ${relation}, expected to be set to ${joinList(vals, ', ')}`);
            }
        }
    }
};
