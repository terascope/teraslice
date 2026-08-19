import { isGeoShapeMultiPolygon } from '@terascope/geo-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isGeoJSONColumn, isGeoShapeSql } from './sql-utils.js';

export const isGeoShapeMultiPolygonConfig: FieldValidateConfig = {
    name: 'isGeoShapeMultiPolygon',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: 'Point', coordinates: [12, 12] },
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: 'Polygon', coordinates: [[[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]]] },
            output: null,
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: {
                type: 'MultiPolygon',
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
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                    ]
                ]
            },
        }
    ],
    description: 'Returns the input if it is a valid geo-json multi-polygon, otherwise returns null',
    create() {
        return isGeoShapeMultiPolygon;
    },
    /** `isGeoJSON` plus an exact-case `type`. */
    sql: {
        applies: (_args, inputConfig) => isGeoJSONColumn(inputConfig),
        expression: ({ value }) => isGeoShapeSql(value, 'MultiPolygon', 'multipolygon'),
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ]
};
