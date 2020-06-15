import * as utils from '@terascope/utils';
import * as t from '@terascope/types';
import { AnyQuery } from '@terascope/types';
import {
    polyHasPoint,
    makeShape,
    polyHasShape,
    validateListCoords
} from './helpers';
import * as i from '../../interfaces';

const compatMapping = {
    [t.GeoShapeType.Polygon]: t.ESGeoShapeType.Polygon,
    [t.GeoShapeType.MultiPolygon]: t.ESGeoShapeType.MultiPolygon,
};

interface Holes {
    bool: {
        must_not: t.GeoQuery[];
    };
}
interface PolyHolesQuery {
    bool: {
        should: [t.GeoQuery, Holes];
    };
}

function validate(params: i.Term[]): { polygonShape: t.GeoShape; relation: t.GeoShapeRelation } {
    const geoPointsParam = params.find((node) => node.field === 'points');
    const geoRelationParam = params.find((node) => node.field === 'relation');
    let relation: t.GeoShapeRelation;

    if (geoRelationParam) {
        const relationKeys = Object.values(t.GeoShapeRelation);
        if (!relationKeys.includes(geoRelationParam.value as t.GeoShapeRelation)) {
            throw new utils.TSError(`Invalid relation value "${geoRelationParam.value}"`);
        }
        relation = geoRelationParam.value as t.GeoShapeRelation;
    } else {
        relation = t.GeoShapeRelation.Within;
    }

    if (geoPointsParam == null) throw new utils.TSError('Invalid geoPolygon query, need to specify a "points" parameter');

    let polygonShape: t.GeoShape = {
        type: t.GeoShapeType.Polygon,
        coordinates: []
    };

    const geoPointsValue = geoPointsParam.value;

    if (utils.isGeoShapePolygon(geoPointsValue) || utils.isGeoShapeMultiPolygon(geoPointsValue)) {
        polygonShape = geoPointsValue;
    } else {
        if (!Array.isArray(geoPointsParam.value)) throw new utils.TSError('Invalid points parameter, it must either be a geoshape or be an array of geo-points');

        const points: t.CoordinateTuple[] = geoPointsParam.value.map((node) => {
            const value = node.value || node;
            const { lat, lon } = utils.parseGeoPoint(value);
            return [lon, lat];
        });
        const coords = validateListCoords(points);
        polygonShape.coordinates = coords;
    }

    return { polygonShape, relation };
}

const geoPolygon: i.FunctionDefinition = {
    name: 'geoPolygon',
    version: '1',
    create(_field: string, params: any, { logger, typeConfig }) {
        if (!_field || _field === '*') throw new Error('Field for geoPolygon cannot be empty or "*"');
        const { polygonShape, relation } = validate(params);
        let type: string;

        if (utils.isWildCardString(_field)) {
            const results: string[] = [];
            // collect all pertinent typeConfig fields to wildcard
            for (const [key] of Object.entries(typeConfig)) {
                if (utils.matchWildcard(_field, key)) results.push(typeConfig[key]);
            }
            const types = utils.uniq(results);
            if (types.length > 1) throw new utils.TSError(`Cannot query geoPolygon against different field types ${JSON.stringify(types)}`);
            [type] = types;
        } else {
            type = typeConfig[_field];
            // can remove the second check when "geo" if fully deprecated
        }

        const targetIsGeoPoint = type === t.xLuceneFieldType.GeoPoint
                || type === t.xLuceneFieldType.Geo
                || type === undefined;

        function makeESPolyQuery(field: string, points: t.CoordinateTuple[]) {
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
            coordinates: t.CoordinateTuple[][]
        ): t.GeoQuery | PolyHolesQuery {
            // it has no holes
            if (coordinates.length === 1) {
                return makeESPolyQuery(field, coordinates[0]);
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
                    filter.bool.filter.push(makeESPolyQuery(field, coords));
                } else {
                    holes.bool.must_not.push(makeESPolyQuery(field, coords));
                }
            });

            filter.bool.filter.push(holes);
            query.bool.should.push(filter);
            return query as PolyHolesQuery;
        }

        function esPolyToPointQuery(field: string) {
            // TODO: chech if points is a polygon with holes
            if (utils.isGeoShapePolygon(polygonShape)) {
                const query = makePolygonQuery(field, polygonShape.coordinates);
                if (logger.level() === 10) logger.trace('built geo polygon to point query', { query });

                return { query };
            }

            if (utils.isGeoShapeMultiPolygon(polygonShape)) {
                const query = {
                    bool: {
                        should: polygonShape.coordinates.map(
                            (polyCoords) => makePolygonQuery(field, polyCoords)
                        )
                    }
                };
                if (logger.level() === 10) logger.trace('built geo polygon to point query', { query });

                return { query };
            }

            return { query: {} };
        }

        function esPolyToPolyQuery(field: string) {
            const esType = compatMapping[polygonShape.type] || t.ESGeoShapeType.Polygon;
            const query = {
                geo_shape: {
                    [field]: {
                        shape: {
                            type: esType,
                            coordinates: polygonShape.coordinates
                        },
                        relation
                    }
                }
            } as AnyQuery;
            if (logger.level() === 10) logger.trace('built geo polygon to polygon query', { query });

            return { query };
        }

        function polyToGeoPointMatcher() {
            const polygon = makeShape(polygonShape);
            // Nothing matches so return false
            if (polygon == null) return () => false;
            return polyHasPoint(polygon);
        }

        function polyToGeoShapeMatcher() {
            const polygon = makeShape(polygonShape);
            if (polygon == null) return () => false;
            const fn = polyHasShape(polygon, relation);
            return fn;
        }

        return {
            match: targetIsGeoPoint ? polyToGeoPointMatcher() : polyToGeoShapeMatcher(),
            toElasticsearchQuery: targetIsGeoPoint ? esPolyToPointQuery : esPolyToPolyQuery
        };
    }
};

export default geoPolygon;
