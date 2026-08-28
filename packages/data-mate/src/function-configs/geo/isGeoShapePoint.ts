import { isGeoShapePoint } from '@terascope/geo-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { isGeoJSONColumn, isGeoShapeSql } from './sql-utils.js';

export const isGeoShapePointConfig: FieldValidateConfig = {
    name: 'isGeoShapePoint',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: 'Point', coordinates: [12, 12] },
            output: { type: 'Point', coordinates: [12, 12] },
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
            output: null,
        }
    ],
    description: 'Returns the input if it is a valid geo-json point, otherwise returns null',
    create() {
        return isGeoShapePoint;
    },
    /** `isGeoJSON` plus an exact-case `type`. See `isGeoShapeSql` for why the case matters. */
    sql: {
        applies: (_args, inputConfig) => isGeoJSONColumn(inputConfig),
        expression: ({ value }) => isGeoShapeSql(value, 'Point', 'point'),
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.Object,
    ]
};
