import {
    AnyQuery, GeoShapeRelation, ESGeoShapeType,
    xLuceneVariables, xLuceneFieldType
} from '@terascope/types';
import { parseGeoPoint, geoContainsFP } from '@terascope/geo-utils';
import { getFieldValue, logger } from '../../utils.js';
import * as i from '../../interfaces.js';

function validate(params: i.Term[], variables: xLuceneVariables) {
    const geoPointParam = params.find((node) => node.field === 'point');
    if (geoPointParam == null) {
        throw new TypeError('Invalid geoContainsPoint query, need to specify a "point" parameter');
    }
    const pointData = parseGeoPoint(getFieldValue<string>(geoPointParam.value, variables));

    return { lat: pointData.lat, lon: pointData.lon };
}

const geoContainsPoint: i.FunctionDefinition = {
    name: 'geoContainsPoint',
    version: '1',
    create({
        node, variables,
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for geoContainsPoint cannot be empty or "*"');
        }
        const { lat, lon } = validate(node.params as i.Term[], variables);

        function toElasticsearchQuery(field: string) {
            const query: AnyQuery = {
                geo_shape: {
                    [field]: {
                        shape: {
                            type: ESGeoShapeType.Point,
                            coordinates: [lon, lat]
                        },
                        relation: GeoShapeRelation.Intersects
                    }
                }
            };

            if (logger.level() === 10) logger.trace('built geo shape query', { query });

            return { query };
        }

        /**
         * Whether the shape in the column contains the point.
         *
         * `isPointColumn` decides how the column becomes a geometry; a `geo-point` column
         * can only "contain" the same point, which is what an equality of geometries gives.
        */
        function toSQLQuery(field: string, options: i.FunctionSQLOptions) {
            const { dialect, type_config: typeConfig } = options;
            const fieldType = typeConfig?.[field];
            const isPointColumn = fieldType === xLuceneFieldType.GeoPoint
                || fieldType === xLuceneFieldType.Geo;

            return {
                query: dialect.geoContainsPoint(
                    dialect.fieldRef(field), { lat, lon }, isPointColumn
                )
            };
        }

        return {
            match: geoContainsFP({ lat, lon }),
            toElasticsearchQuery,
            toSQLQuery
        };
    }
};

export default geoContainsPoint;
