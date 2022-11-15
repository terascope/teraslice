import * as utils from '@terascope/utils';
import * as t from '@terascope/types';
import {
    toString, geoRelationFP, validateListCoords,
    polyHasHoles
} from '@terascope/utils';
import * as i from '../../interfaces.js';
import { getFieldValue, logger } from '../../utils.js';

const compatMapping = {
    [t.GeoShapeType.Polygon]: t.ESGeoShapeType.Polygon,
    [t.GeoShapeType.MultiPolygon]: t.ESGeoShapeType.MultiPolygon,
} as const;

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

const relations = new Set(Object.values(t.GeoShapeRelation));

function validate(
    params: i.Term[],
    variables: t.xLuceneVariables
): { polygonShape: t.GeoShape; relation: t.GeoShapeRelation } {
    const geoPointsParam = params.find((node) => node.field === 'points');
    const geoRelationParam = params.find((node) => node.field === 'relation');
    let relation: t.GeoShapeRelation;

    if (geoRelationParam) {
        const geoRelationValue = getFieldValue<t.GeoShapeRelation>(
            geoRelationParam.value, variables
        );
        if (!relations.has(geoRelationValue)) {
            throw new TypeError(`Invalid relation value "${geoRelationValue}"`);
        }
        relation = geoRelationValue;
    } else {
        relation = t.GeoShapeRelation.Within;
    }

    if (geoPointsParam == null) {
        throw new TypeError('Invalid geoPolygon query, need to specify a "points" parameter');
    }

    let polygonShape: t.GeoShape = {
        type: t.GeoShapeType.Polygon,
        coordinates: []
    };

    const geoPointsValue = getFieldValue(geoPointsParam.value, variables);

    if (utils.isGeoShapePolygon(geoPointsValue) || utils.isGeoShapeMultiPolygon(geoPointsValue)) {
        polygonShape = geoPointsValue;
    } else {
        if (!Array.isArray(geoPointsValue)) {
            throw new TypeError('Invalid points parameter, it must either be a geoShape or be an array of geo-points');
        }

        const points: t.CoordinateTuple[] = geoPointsValue.map((node) => {
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
    create({
        node, type_config: typeConfig, variables,
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for geoPolygon cannot be empty or "*"');
        }

        const { polygonShape, relation } = validate(
            node.params as i.Term[], variables
        );
        let type: string;

        if (utils.isWildCardString(node.field)) {
            const results: string[] = [];
            // collect all pertinent typeConfig fields to wildcard
            for (const [key] of Object.entries(typeConfig)) {
                if (utils.matchWildcard(node.field, key)) results.push(typeConfig[key]);
            }
            const types = utils.uniq(results);
            if (types.length > 1) {
                throw new utils.TSError(`Invalid geoPolygon query against different field types: ${toString(types)}`, {
                    context: { safe: true },
                    statusCode: 400
                });
            }
            [type] = types;
        } else {
            type = typeConfig[node.field];
            // can remove the second check when "geo" if fully deprecated
        }

        const targetIsGeoPoint = type === t.xLuceneFieldType.GeoPoint
                || type === t.xLuceneFieldType.Geo
                || type === undefined;

        const isDisjoint = relation === t.GeoShapeRelation.Disjoint;

        if (targetIsGeoPoint && polyHasHoles(polygonShape) && isDisjoint) {
            throw new Error('Invalid argument points, when running a disjoint query with a polygon/multi-polygon with holes, it must be against data of type geo-json');
        }

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

            if (relation === t.GeoShapeRelation.Disjoint) {
                // we do not want results that the field does not exist
                filter.bool.filter.push({ exists: { field } });
                holes.bool.must_not.push(makeESPolyQuery(field, coordinates[0]));
            } else {
                coordinates.forEach((coords, index) => {
                    if (index === 0) {
                        filter.bool.filter.push(makeESPolyQuery(field, coords));
                    } else {
                        holes.bool.must_not.push(makeESPolyQuery(field, coords));
                    }
                });
            }

            filter.bool.filter.push(holes);
            query.bool.should.push(filter);
            return query as PolyHolesQuery;
        }

        function esPolyToPointQuery(field: string) {
            if (utils.isGeoShapePolygon(polygonShape)) {
                const query = makePolygonQuery(field, polygonShape.coordinates);
                if (logger.level() === 10) logger.trace('built geo polygon to point query', { query });

                return { query };
            }

            if (utils.isGeoShapeMultiPolygon(polygonShape)) {
                const dsl = polygonShape.coordinates.map(
                    (polyCoords) => makePolygonQuery(field, polyCoords)
                );

                const query: any = {
                    bool: {}
                };

                if (relation === t.GeoShapeRelation.Disjoint) {
                    query.bool.must = dsl;
                } else {
                    query.bool.should = dsl;
                }

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
            } as t.AnyQuery;
            if (logger.level() === 10) logger.trace('built geo polygon to polygon query', { query });

            return { query };
        }

        if (targetIsGeoPoint) {
            if (relation === t.GeoShapeRelation.Contains) {
                throw new Error(`Cannot query against geo-points with relation set to "${t.GeoShapeRelation.Contains}"`);
            }
            return {
                match: geoRelationFP(polygonShape, relation),
                toElasticsearchQuery: esPolyToPointQuery
            };
        }

        return {
            match: geoRelationFP(polygonShape, relation),
            toElasticsearchQuery: esPolyToPolyQuery
        };
    }
};

export default geoPolygon;
