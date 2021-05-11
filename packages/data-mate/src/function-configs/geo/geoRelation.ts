import {
    joinList, geoRelationFP, toGeoJSON
} from '@terascope/utils';
import {
    FieldType, GeoShapeRelation, GeoInput
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
    // {
    //     args: { point: '33.435518,-111.873616', distance: '5000m' },
    //     config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
    //     field: 'testField',
    //     input: '33.435967,-111.867710',
    //     output: '33.435967,-111.867710',
    // },
];

export const geoRelationConfig: FieldValidateConfig<GeoPolygonArgs> = {
    name: 'geoRelation',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Compares geo points/polygons/multi-polygons against other points/polygons/multi-polygons',
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
