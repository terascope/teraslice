import {
    isGeoJSON, joinList, geoPolygonFP
} from '@terascope/utils';
import {
    FieldType, GeoShapeRelation, JoinGeoShape
} from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces';

export interface GeoPolygonArgs {
    geoShape: JoinGeoShape;
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

export const geoPolygonConfig: FieldValidateConfig<GeoPolygonArgs> = {
    name: 'geoPolygon',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Compares geo-polygons/multi-polygons against other geo-polygons/multi-polygons',
    create({ geoShape, relation = GeoShapeRelation.Within }) {
        const fn = geoPolygonFP(geoShape, relation);
        return (input: unknown) => fn(input as JoinGeoShape);
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Object,
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        point: {
            type: FieldType.GeoJSON,
            description: 'The geo-point used to compare to other points'
        },
        distance: {
            type: FieldType.String,
            description: `How the geo-shapes should relate to each other, defaults to "contains" : ${joinList(Object.values(GeoShapeRelation), ', ')}
            `.trim()
        }
    },
    required_arguments: ['geoShape'],
    validate_arguments({ geoShape, relation }) {
        if (!isGeoJSON(geoShape)) {
            throw new Error(`Invalid parameter geoShape: ${JSON.stringify(geoShape)}, is not a valid geo-json`);
        }

        if (relation) {
            const vals = Object.values(GeoShapeRelation);
            if (!vals.includes(relation)) {
                throw new Error(`Invalid relation: ${relation}, expected to be set to ${joinList(vals, ', ')}`);
            }
        }
    }
};
