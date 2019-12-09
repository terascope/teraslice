import { TSError, uniq } from '@terascope/utils';
import {
    polyHasPoint, makePolygon, polyHasShape, makeCoordinatesFromGeoPoint
} from './helpers';
import { parseGeoPoint } from '../../../utils';
import * as i from '../../interfaces';
import { AnyQuery, ESGeoShapeType } from '../../../translator/interfaces';
import {
    FieldType, GeoShapeRelation, CoordinateTuple
} from '../../../interfaces';
import { isWildCardString, parseWildCard, matchString } from '../../../document-matcher/logic-builder/string';

function validate(params: i.Term[]) {
    const geoPointsParam = params.find((node) => node.field === 'points');
    const geoRelationParam = params.find((node) => node.field === 'relation');
    let relation: GeoShapeRelation;

    if (geoRelationParam) {
        const relationKeys = Object.values(GeoShapeRelation);
        if (!relationKeys.includes(geoRelationParam.value as GeoShapeRelation)) {
            throw new TSError(`relation parameter "${geoRelationParam.value}" is not a valid relation value`);
        }
        relation = geoRelationParam.value as GeoShapeRelation;
    } else {
        relation = GeoShapeRelation.Within;
    }

    if (geoPointsParam == null) throw new Error('geoPolygon query needs to specify a "points" parameter');
    if (!Array.isArray(geoPointsParam.value)) throw new Error('points parameter must be an array');

    const points = geoPointsParam.value.map((node) => {
        if (!node.value) throw new Error('points parameter must be an array of string values');
        return parseGeoPoint(node.value);
    });

    if (points.length < 3) throw new Error('geoPolygon points parameter must have at least three points');

    return { points, relation };
}

const geoPolygon: i.FunctionDefinition = {
    name: 'geoPolygon',
    version: '1',
    create(_field: string, params: any, { logger, typeConfig }) {
        if (!_field || _field === '*') throw new Error('field for geoPolygon cannot be empty or "*"');
        const { points, relation } = validate(params);
        let type: string;

        if (isWildCardString(_field)) {
            const regex = parseWildCard(_field);
            const results: string[] = [];
            // collect all pertinent typeConfig fields to wildcard
            for (const [key] of Object.entries(typeConfig)) {
                if (matchString(key, regex)) results.push(typeConfig[key]);
            }
            const types = uniq(results);
            if (types.length > 1) throw new TSError(`Cannot query geoPolygon against different field types ${JSON.stringify(types)}`);
            [type] = types;
        } else {
            type = typeConfig[_field];
            // can remove the second check when "geo" if fully deprecated
        }

        const targetIsGeoPoint = type === FieldType.GeoPoint
                || type === FieldType.Geo
                || type === undefined;

        function esPolyToPointQuery(field: string) {
            const query: AnyQuery = {
                geo_polygon: {
                    [field]: {
                        points
                    }
                }
            };

            logger.trace('built geo polygon to point query', { query });

            return { query };
        }

        function esPolyToPolyQuery(field: string) {
            const coordinates: CoordinateTuple[][] = [points.map(makeCoordinatesFromGeoPoint)];
            const query: AnyQuery = {
                geo_shape: {
                    [field]: {
                        shape: {
                            type: ESGeoShapeType.Polygon,
                            coordinates
                        },
                        relation
                    }
                }
            };
            logger.trace('built geo polygon to polygon query', { query });

            return { query };
        }

        function polyToGeoPointMatcher() {
            const polygon = makePolygon(points);
            // Nothing matches so return false
            if (polygon == null) return () => false;
            return polyHasPoint(polygon);
        }

        function polyToSGeoShapeMatcher() {
            const polygon = makePolygon(points);
            if (polygon == null) return () => false;
            return polyHasShape(polygon, relation);
        }

        return {
            match: targetIsGeoPoint ? polyToGeoPointMatcher() : polyToSGeoShapeMatcher(),
            toElasticsearchQuery: targetIsGeoPoint ? esPolyToPointQuery : esPolyToPolyQuery
        };
    }
};

export default geoPolygon;
