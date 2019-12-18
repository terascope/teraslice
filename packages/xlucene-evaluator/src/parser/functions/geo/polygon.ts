import { TSError, uniq } from '@terascope/utils';
import {
    polyHasPoint,
    makeShape,
    polyHasShape,
    isGeoShapePolygon,
    isGeoShapeMultiPolygon
} from './helpers';
import { parseGeoPoint } from '../../../utils';
import * as i from '../../interfaces';
import { AnyQuery, ESGeoShapeType, GeoQuery } from '../../../translator/interfaces';
import {
    FieldType,
    GeoShapeRelation,
    CoordinateTuple,
    GeoShapeType,
    GeoShape,
} from '../../../interfaces';
import { isWildCardString, parseWildCard, matchString } from '../../../document-matcher/logic-builder/string';
// TODO: fix mapping here
const compatMapping = {
    [GeoShapeType.Polygon]: ESGeoShapeType.Polygon,
    [GeoShapeType.MultiPolygon]: ESGeoShapeType.MultiPolygon,
};

interface Holes {
    bool: {
        must_not: GeoQuery[];
    };
}
interface PolyHolesQuery {
    bool: {
        should: [GeoQuery, Holes];
    };
}

function validate(params: i.Term[]): { polygonShape: GeoShape; relation: GeoShapeRelation } {
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

    if (geoPointsParam == null) throw new TSError('geoPolygon query needs to specify a "points" parameter');

    let polygonShape: GeoShape = {
        type: GeoShapeType.Polygon,
        coordinates: []
    };

    if (isGeoShapePolygon(geoPointsParam.value) || isGeoShapeMultiPolygon(geoPointsParam.value)) {
        polygonShape = geoPointsParam.value;
    } else {
        if (!Array.isArray(geoPointsParam.value)) throw new TSError('points parameter must either be a geoshape or be an array of geo-points');

        const points: CoordinateTuple[] = geoPointsParam.value.map((node) => {
            const value = node.value || node;
            const { lat, lon } = parseGeoPoint(value);
            return [lon, lat];
        });

        if (points.length < 3) throw new Error('geoPolygon points parameter must have at least three geo-points');
        polygonShape.coordinates.push(points);
    }

    return { polygonShape, relation };
}

const geoPolygon: i.FunctionDefinition = {
    name: 'geoPolygon',
    version: '1',
    // @ts-ignore type issues with esPolyToPointQuery AnyQuery results
    create(_field: string, params: any, { logger, typeConfig }) {
        if (!_field || _field === '*') throw new Error('field for geoPolygon cannot be empty or "*"');
        const { polygonShape, relation } = validate(params);
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

        function ESPolyQuery(field: string, points: CoordinateTuple[]) {
            return {
                geo_polygon: {
                    [field]: {
                        points
                    }
                }
            };
        }

        function makePolygonQuery(
            field: string,
            coordinates: CoordinateTuple[][]
        ): GeoQuery | PolyHolesQuery {
            // it has no holes
            if (coordinates.length === 1) {
                return ESPolyQuery(field, coordinates[0]);
            }

            const query = {
                bool: {
                    should: [] as any
                }
            };

            const filter = {
                bool: {
                    filter: [] as any
                }
            };

            const holes: Holes = {
                bool: {
                    must_not: []
                }
            };

            coordinates.forEach((coords, index) => {
                if (index === 0) {
                    filter.bool.filter.push(ESPolyQuery(field, coords));
                } else {
                    holes.bool.must_not.push(ESPolyQuery(field, coords));
                }
            });

            filter.bool.filter.push(holes);
            query.bool.should.push(filter);
            return query as PolyHolesQuery;
        }

        function esPolyToPointQuery(field: string) {
            // TODO: chech if points is a polygon with holes
            if (isGeoShapePolygon(polygonShape)) {
                const query = makePolygonQuery(field, polygonShape.coordinates);
                logger.trace('built geo polygon to point query', { query });

                return { query };
            }

            if (isGeoShapeMultiPolygon(polygonShape)) {
                const query = {
                    bool: {
                        should: polygonShape.coordinates.map(
                            (polyCoords) => makePolygonQuery(field, polyCoords)
                        )
                    }
                };
                logger.trace('built geo polygon to point query', { query });

                return { query };
            }

            return { query: {} };
        }

        function esPolyToPolyQuery(field: string) {
            const esType = compatMapping[polygonShape.type] || ESGeoShapeType.Polygon;
            // @ts-ignore
            const query: AnyQuery = {
                geo_shape: {
                    [field]: {
                        shape: {
                            type: esType,
                            coordinates: polygonShape.coordinates
                        },
                        relation
                    }
                }
            };
            logger.trace('built geo polygon to polygon query', { query });

            return { query };
        }

        function polyToGeoPointMatcher() {
            const polygon = makeShape(polygonShape);
            // Nothing matches so return false
            if (polygon == null) return () => false;
            return polyHasPoint(polygon);
        }

        function polyToSGeoShapeMatcher() {
            const polygon = makeShape(polygonShape);
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
