import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import {
    xLuceneFieldType,
    xLuceneTypeConfig,
    GeoShapeType,
    CoordinateTuple,
    ESGeoShapeType,
    GeoShapeRelation
} from '@terascope/types';
import { randomPolygon } from '@turf/random';
import { getCoords } from '@turf/invariant';
import { Parser, initFunction } from '../../src';
import { FunctionElasticsearchOptions, FunctionNode } from '../../src/interfaces';

describe('geoPolygon', () => {
    describe('with typeconfig field set to GeoPoint', () => {
        const typeConfig: xLuceneTypeConfig = { location: xLuceneFieldType.GeoPoint };
        const options: FunctionElasticsearchOptions = {
            logger: debugLogger('test'),
            geo_sort_order: 'asc',
            geo_sort_unit: 'meters',
            type_config: {}
        };

        it('can make a function ast', () => {
            const query = 'location:geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

            const { ast } = new Parser(query, {
                type_config: typeConfig,
            });
            const {
                name, type, field
            } = ast as FunctionNode;

            const instance = initFunction({
                node: ast as FunctionNode,
                variables: {},
                type_config: typeConfig
            });

            expect(name).toEqual('geoPolygon');
            expect(type).toEqual('function');
            expect(field).toEqual('location');
            expect(instance.match).toBeFunction();
            expect(instance.toElasticsearchQuery).toBeFunction();
        });

        describe('elasticsearch dsl', () => {
            it('can produce elasticsearch DSL with array of points', () => {
                expect.hasAssertions();
                // validation of points makes sure that it is enclosed
                const results = {
                    geo_polygon: {
                        location: {
                            points: [
                                [140.43, 70.43],
                                [123.4, 81.3],
                                [154.4, 89.3],
                                [140.43, 70.43]
                            ]
                        }
                    }
                };

                const queries = [
                    'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon (points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon( points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    "location:geoPolygon(points:['70.43,140.43', '81.3,123.4', '89.3,154.4'])",
                    'location:geoPolygon(points:[    "70.43,140.43", "81.3,123.4", "89.3,154.4" ])',
                    'location:geoPolygon(points:["70.43,140.43" "81.3,123.4" "89.3,154.4"])',
                ];

                const astResults = queries
                    .map((query) => new Parser(query, { type_config: typeConfig }))
                    .map((parser) => initFunction({
                        node: (parser.ast as FunctionNode),
                        type_config: typeConfig,
                        variables: {},
                    }).toElasticsearchQuery('location', options));

                astResults.forEach((ast) => {
                    expect(ast.query).toEqual(results);
                    expect(ast.sort).toBeUndefined();
                });
            });

            it('can produce elasticsearch DSL with variables set to polygons', () => {
                const variables = {
                    points1: {
                        type: GeoShapeType.Polygon,
                        coordinates: [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        ]
                    }
                };
                const xQuery = 'location: geoPolygon(points: $points1)';

                const { ast } = new Parser(xQuery, {
                    type_config: typeConfig,
                }).resolveVariables(variables);

                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables,
                    type_config: typeConfig
                });

                const expected = {
                    geo_polygon: {
                        location: {
                            points: [
                                [10, 10],
                                [10, 50],
                                [50, 50],
                                [50, 10],
                                [10, 10]
                            ]
                        }
                    }
                };

                const { query, sort } = toElasticsearchQuery('location', options);

                expect(query).toEqual(expected);
                expect(sort).toBeUndefined();
            });

            it('can produce elasticsearch DSL with variables set to polygons with holes', () => {
                const variables = {
                    points1: {
                        type: GeoShapeType.Polygon,
                        coordinates: [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                            [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                        ]
                    }
                };
                const xQuery = 'location: geoPolygon(points: $points1)';

                const { ast } = new Parser(xQuery, {
                    type_config: typeConfig
                }).resolveVariables(variables);

                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables,
                    type_config: typeConfig
                });

                const expected = {
                    bool: {
                        should: [
                            {
                                bool: {
                                    filter: [
                                        {
                                            geo_polygon: {
                                                location: {
                                                    points: [
                                                        [10, 10],
                                                        [10, 50],
                                                        [50, 50],
                                                        [50, 10],
                                                        [10, 10]
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            bool: {
                                                must_not: [
                                                    {
                                                        geo_polygon: {
                                                            location: {
                                                                points: [
                                                                    [20, 20],
                                                                    [20, 40],
                                                                    [40, 40],
                                                                    [40, 20],
                                                                    [20, 20]
                                                                ]
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                };

                const { query, sort } = toElasticsearchQuery('location', options);

                expect(query).toEqual(expected);
                expect(sort).toBeUndefined();
            });

            it('can produce elasticsearch DSL with variables set to multi-polygons', () => {
                const variables = {
                    points1: {
                        type: GeoShapeType.MultiPolygon,
                        coordinates: [
                            [
                                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                            ],
                            [
                                [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                            ]
                        ]
                    }
                };
                const xQuery = 'location: geoPolygon(points: $points1)';

                const { ast } = new Parser(xQuery, {
                    type_config: typeConfig,
                }).resolveVariables(variables);

                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables,
                    type_config: typeConfig
                });

                const expected = {
                    bool: {
                        should: [
                            {
                                geo_polygon: {
                                    location: {
                                        points: [
                                            [10, 10],
                                            [10, 50],
                                            [50, 50],
                                            [50, 10],
                                            [10, 10]
                                        ]
                                    }
                                }
                            },
                            {
                                geo_polygon: {
                                    location: {
                                        points: [
                                            [-10, -10],
                                            [-10, -50],
                                            [-50, -50],
                                            [-50, -10],
                                            [-10, -10]]
                                    }
                                }
                            }
                        ]
                    }
                };

                const { query, sort } = toElasticsearchQuery('location', options);

                expect(query).toEqual(expected);
                expect(sort).toBeUndefined();
            });
        });

        describe('matcher', () => {
            it('can match points to polygon results', () => {
                const query = 'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                const geoPoint1 = '83.435967,144.867710';
                const geoPoint2 = '-22.435967,-150.867710';

                expect(match(geoPoint1)).toEqual(true);
                expect(match(geoPoint2)).toEqual(false);
            });
        });
    });

    describe('with typeconfig field set to GeoJSON', () => {
        const typeConfig: xLuceneTypeConfig = { location: xLuceneFieldType.GeoJSON };
        const options: FunctionElasticsearchOptions = {
            logger: debugLogger('test'),
            geo_sort_order: 'asc',
            geo_sort_unit: 'meters',
            type_config: {}
        };

        it('can parse really long polygons', () => {
            const { features: [polygon] } = randomPolygon(1, { num_vertices: 8000 });
            const [coordList] = getCoords(polygon);
            const coords = coordList.map((points: [number, number]) => {
                const [lon, lat] = points;
                return `"${lat}, ${lon}"`;
            }).join(', ');

            const query = `location:geoPolygon(points:[${coords}])`;

            expect(() => new Parser(query, { type_config: typeConfig })).not.toThrow();
        });

        it('can make a function ast', () => {
            const query = 'location:geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

            const { ast } = new Parser(query, {
                type_config: typeConfig,
            });
            const {
                name, type, field
            } = ast as FunctionNode;

            const instance = initFunction({
                node: ast as FunctionNode,
                variables: {},
                type_config: typeConfig
            });

            expect(name).toEqual('geoPolygon');
            expect(type).toEqual('function');
            expect(field).toEqual('location');
            expect(instance.match).toBeFunction();
            expect(instance.toElasticsearchQuery).toBeFunction();
        });

        describe('elasticsearch dsl', () => {
            it('can produce default elasticsearch DSL', () => {
                expect.hasAssertions();

                const results = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: ESGeoShapeType.Polygon,
                                coordinates: [
                                    [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                                ]
                            },
                            relation: GeoShapeRelation.Within
                        }
                    }
                };

                const queries = [
                    'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon (points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon( points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    "location:geoPolygon(points:['70.43,140.43', '81.3,123.4', '89.3,154.4'])",
                    'location:geoPolygon(points:[    "70.43,140.43", "81.3,123.4", "89.3,154.4" ])',
                    'location:geoPolygon(points:["70.43,140.43" "81.3,123.4" "89.3,154.4"])',
                ];

                const astResults = queries
                    .map((query) => new Parser(query, { type_config: typeConfig }))
                    .map((parser) => initFunction({
                        node: (parser.ast as FunctionNode),
                        type_config: typeConfig,
                        variables: {},
                    }).toElasticsearchQuery('location', options));

                astResults.forEach((ast) => {
                    expect(ast.query).toEqual(results);
                    expect(ast.sort).toBeUndefined();
                });
            });

            it('can produce elasticsearch DSL with relation set to within', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: ESGeoShapeType.Polygon,
                                coordinates: [
                                    [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                                ]
                            },
                            relation: GeoShapeRelation.Within
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Within}")`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables: {},
                    type_config: typeConfig
                });
                const results = toElasticsearchQuery('location', options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });

            it('can produce elasticsearch DSL with relation set to intersects', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: ESGeoShapeType.Polygon,
                                coordinates: [
                                    [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                                ]
                            },
                            relation: GeoShapeRelation.Intersects
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Intersects}")`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables: {},
                    type_config: typeConfig
                });
                const results = toElasticsearchQuery('location', options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });

            it('can produce elasticsearch DSL with relation set to contains', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: ESGeoShapeType.Polygon,
                                coordinates: [
                                    [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                                ]
                            },
                            relation: GeoShapeRelation.Contains
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Contains}")`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables: {},
                    type_config: typeConfig
                });
                const results = toElasticsearchQuery('location', options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });

            it('can produce elasticsearch DSL with relation set to disjoint', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: ESGeoShapeType.Polygon,
                                coordinates: [
                                    [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                                ]
                            },
                            relation: GeoShapeRelation.Disjoint
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Disjoint}")`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { toElasticsearchQuery } = initFunction({
                    node: ast as FunctionNode,
                    variables: {},
                    type_config: typeConfig
                });
                const results = toElasticsearchQuery('location', options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });
        });

        describe('matcher', () => {
            const pointInPoly: CoordinateTuple = [15, 15];
            const pointOutOfPoly: CoordinateTuple = [-30, -30];
            const queryPoints = ['10,10', '10,50', '50,50', '50,10', '10,10'];
            const containPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
            };
            const withinPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
            };
            const disjointPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]]]
            };
            const intersectPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
            };

            const matchingPoint = {
                type: GeoShapeType.Point,
                coordinates: pointInPoly
            };

            const nonMatchingPoint = {
                type: GeoShapeType.Point,
                coordinates: pointOutOfPoly
            };

            const multiPolygon = {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                    ]
                ]
            };

            const multiPolygonWithHoles = {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
                    ]
                ]
            };

            it('poly v poly default relations matches within', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(withinPoints)).toEqual(true);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersectPoints)).toEqual(false);
            });

            it('poly v poly relations set to within', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Within})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(withinPoints)).toEqual(true);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersectPoints)).toEqual(false);
            });

            it('poly v poly relations set to contains', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Contains})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(withinPoints)).toEqual(false);
                expect(match(containPoints)).toEqual(true);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersectPoints)).toEqual(false);
            });

            it('poly v poly relations set to intersets', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Intersects})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(withinPoints)).toEqual(false);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersectPoints)).toEqual(true);
            });

            it('poly v poly relations set to disjoint', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(withinPoints)).toEqual(false);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(true);
                expect(match(intersectPoints)).toEqual(false);
            });

            it('poly v geo_shape point with default relation (within)', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(matchingPoint)).toEqual(true);
                expect(match(nonMatchingPoint)).toEqual(false);
            });

            it('poly v geo_shape point with contains relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Contains})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(matchingPoint)).toEqual(false);
                expect(match(nonMatchingPoint)).toEqual(false);
            });

            it('poly v geo_shape point with intersects relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Intersects})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(matchingPoint)).toEqual(false);
                expect(match(nonMatchingPoint)).toEqual(false);
            });

            it('poly v geo_shape point with disjoint relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(matchingPoint)).toEqual(false);
                expect(match(nonMatchingPoint)).toEqual(true);
            });

            it('poly v multi-polygon and default relation (within)', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygon)).toEqual(false);
            });

            it('poly v multi-polygon with contains relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Contains})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygon)).toEqual(false);
            });

            it('poly v multi-polygon with intersects relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Intersects})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygon)).toEqual(true);
            });

            it('poly v multi-polygon with disjoint relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygon)).toEqual(false);
            });

            it('poly v multi-polygon with holes and default relation (within)', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygonWithHoles)).toEqual(false);
            });

            it('poly v multi-polygon with holes and contains relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Contains})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygonWithHoles)).toEqual(false);
            });

            it('poly v multi-polygon with holes and intersects relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Intersects})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygonWithHoles)).toEqual(true);
            });

            it('poly v multi-polygon with holes and disjoint relation', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: {}
                });

                expect(match(multiPolygonWithHoles)).toEqual(false);
            });
        });
    });
});
