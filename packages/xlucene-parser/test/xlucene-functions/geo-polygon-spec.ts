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
    // describe('with typeconfig field set to GeoPoint', () => {
    //     const typeConfig: xLuceneTypeConfig = { location: xLuceneFieldType.GeoPoint };
    //     const options: FunctionElasticsearchOptions = {
    //         logger: debugLogger('test'),
    //         geo_sort_order: 'asc',
    //         geo_sort_unit: 'meters',
    //         type_config: {}
    //     };

    //     it('can make a function ast', () => {
    //         const query = 'location:geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

    //         const { ast } = new Parser(query, {
    //             type_config: typeConfig,
    //         });
    //         const {
    //             name, type, field
    //         } = ast as FunctionNode;

    //         const instance = initFunction({
    //             node: ast as FunctionNode,
    //             variables: {},
    //             type_config: typeConfig
    //         });

    //         expect(name).toEqual('geoPolygon');
    //         expect(type).toEqual('function');
    //         expect(field).toEqual('location');
    //         expect(instance.match).toBeFunction();
    //         expect(instance.toElasticsearchQuery).toBeFunction();
    //     });

    //     describe('elasticsearch dsl', () => {
    //         it('can be produced with array of points', () => {
    //             expect.hasAssertions();
    //             // validation of points makes sure that it is enclosed
    //             const results = {
    //                 geo_polygon: {
    //                     location: {
    //                         points: [
    //                             [140.43, 70.43],
    //                             [123.4, 81.3],
    //                             [154.4, 89.3],
    //                             [140.43, 70.43]
    //                         ]
    //                     }
    //                 }
    //             };

    //             const queries = [
    //                 'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
    //                 'location:geoPolygon (points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
    //                 'location:geoPolygon( points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
    //                 "location:geoPolygon(points:['70.43,140.43', '81.3,123.4', '89.3,154.4'])",
    //                 'location:geoPolygon(points:[    "70.43,140.43", "81.3,123.4", "89.3,154.4" ])',
    //                 'location:geoPolygon(points:["70.43,140.43" "81.3,123.4" "89.3,154.4"])',
    //             ];

    //             const astResults = queries
    //                 .map((query) => new Parser(query, { type_config: typeConfig }))
    //                 .map((parser) => initFunction({
    //                     node: (parser.ast as FunctionNode),
    //                     type_config: typeConfig,
    //                     variables: {},
    //                 }).toElasticsearchQuery('location', options));

    //             astResults.forEach((ast) => {
    //                 expect(ast.query).toEqual(results);
    //                 expect(ast.sort).toBeUndefined();
    //             });
    //         });

    //         it('can be produced with variables set to polygons', () => {
    //             const variables = {
    //                 points1: {
    //                     type: GeoShapeType.Polygon,
    //                     coordinates: [
    //                         [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
    //                     ]
    //                 }
    //             };
    //             const xQuery = 'location: geoPolygon(points: $points1)';

    //             const { ast } = new Parser(xQuery, {
    //                 type_config: typeConfig,
    //             }).resolveVariables(variables);

    //             const { toElasticsearchQuery } = initFunction({
    //                 node: ast as FunctionNode,
    //                 variables,
    //                 type_config: typeConfig
    //             });

    //             const expected = {
    //                 geo_polygon: {
    //                     location: {
    //                         points: [
    //                             [10, 10],
    //                             [10, 50],
    //                             [50, 50],
    //                             [50, 10],
    //                             [10, 10]
    //                         ]
    //                     }
    //                 }
    //             };

    //             const { query, sort } = toElasticsearchQuery('location', options);

    //             expect(query).toEqual(expected);
    //             expect(sort).toBeUndefined();
    //         });

    //         it('can be produced with variables set to polygons with holes', () => {
    //             const variables = {
    //                 points1: {
    //                     type: GeoShapeType.Polygon,
    //                     coordinates: [
    //                         [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
    //                         [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
    //                     ]
    //                 }
    //             };
    //             const xQuery = 'location: geoPolygon(points: $points1)';

    //             const { ast } = new Parser(xQuery, {
    //                 type_config: typeConfig
    //             }).resolveVariables(variables);

    //             const { toElasticsearchQuery } = initFunction({
    //                 node: ast as FunctionNode,
    //                 variables,
    //                 type_config: typeConfig
    //             });

    //             const expected = {
    //                 bool: {
    //                     should: [
    //                         {
    //                             bool: {
    //                                 filter: [
    //                                     {
    //                                         geo_polygon: {
    //                                             location: {
    //                                                 points: [
    //                                                     [10, 10],
    //                                                     [10, 50],
    //                                                     [50, 50],
    //                                                     [50, 10],
    //                                                     [10, 10]
    //                                                 ]
    //                                             }
    //                                         }
    //                                     },
    //                                     {
    //                                         bool: {
    //                                             must_not: [
    //                                                 {
    //                                                     geo_polygon: {
    //                                                         location: {
    //                                                             points: [
    //                                                                 [20, 20],
    //                                                                 [20, 40],
    //                                                                 [40, 40],
    //                                                                 [40, 20],
    //                                                                 [20, 20]
    //                                                             ]
    //                                                         }
    //                                                     }
    //                                                 }
    //                                             ]
    //                                         }
    //                                     }
    //                                 ]
    //                             }
    //                         }
    //                     ]
    //                 }
    //             };

    //             const { query, sort } = toElasticsearchQuery('location', options);

    //             expect(query).toEqual(expected);
    //             expect(sort).toBeUndefined();
    //         });

    //         it('can be produced with variables set to multi-polygons', () => {
    //             const variables = {
    //                 points1: {
    //                     type: GeoShapeType.MultiPolygon,
    //                     coordinates: [
    //                         [
    //                             [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
    //                         ],
    //                         [
    //                             [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
    //                         ]
    //                     ]
    //                 }
    //             };
    //             const xQuery = 'location: geoPolygon(points: $points1)';

    //             const { ast } = new Parser(xQuery, {
    //                 type_config: typeConfig,
    //             }).resolveVariables(variables);

    //             const { toElasticsearchQuery } = initFunction({
    //                 node: ast as FunctionNode,
    //                 variables,
    //                 type_config: typeConfig
    //             });

    //             const expected = {
    //                 bool: {
    //                     should: [
    //                         {
    //                             geo_polygon: {
    //                                 location: {
    //                                     points: [
    //                                         [10, 10],
    //                                         [10, 50],
    //                                         [50, 50],
    //                                         [50, 10],
    //                                         [10, 10]
    //                                     ]
    //                                 }
    //                             }
    //                         },
    //                         {
    //                             geo_polygon: {
    //                                 location: {
    //                                     points: [
    //                                         [-10, -10],
    //                                         [-10, -50],
    //                                         [-50, -50],
    //                                         [-50, -10],
    //                                         [-10, -10]]
    //                                 }
    //                             }
    //                         }
    //                     ]
    //                 }
    //             };

    //             const { query, sort } = toElasticsearchQuery('location', options);

    //             expect(query).toEqual(expected);
    //             expect(sort).toBeUndefined();
    //         });
    //     });

    //     describe('matcher', () => {
    //         it('can match points to polygon results', () => {
    //             const query = 'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

    //             const { ast } = new Parser(query, {
    //                 type_config: typeConfig,
    //             });
    //             const { match } = initFunction({
    //                 node: ast as FunctionNode,
    //                 type_config: typeConfig,
    //                 variables: {}
    //             });

    //             const geoPoint1 = '83.435967,144.867710';
    //             const geoPoint2 = '-22.435967,-150.867710';

    //             expect(match(geoPoint1)).toEqual(true);
    //             expect(match(geoPoint2)).toEqual(false);
    //         });
    //     });
    // });

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

            it('can be produced with relation set to within', () => {
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

            it('can be produced with relation set to intersects', () => {
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

            it('can be produced with relation set to contains', () => {
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

            it('can be produced with relation set to disjoint', () => {
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
            const polyContainsQueryPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
            };
            const polyWithinQueryPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
            };
            const polyDisjointQueryPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]]]
            };
            const polyIntersectQueryPoints = {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
            };

            const pointInQueryPoints = {
                type: GeoShapeType.Point,
                coordinates: pointInPoly
            };

            const pointNotInQueryPoint = {
                type: GeoShapeType.Point,
                coordinates: pointOutOfPoly
            };

            const nonMatchingPoint = {
                type: GeoShapeType.Point,
                coordinates: [-80, -80]
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

            const smallMultiPolygon = {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [
                        [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                    ],
                    [
                        [[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]],
                    ]
                ]
            };

            fdescribe('Polygon argument', () => {
                const data = queryPoints;

                fit('with relations set to "within"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Within})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {
                            data1: data
                        }
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(true);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(true);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(true);
                    expect(match(multiPolygon)).toEqual(false);
                    expect(match(multiPolygonWithHoles)).toEqual(false);
                });

                it('relations set to "contains"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(true);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(false);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(false);
                });

                it('with relations set to "intersects"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(true);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(true);
                    expect(match(polyWithinQueryPoints)).toEqual(true);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(true);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(true);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(true);
                });

                it('with relations set to "disjoint"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(true);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(false);
                    expect(match(pointNotInQueryPoint)).toEqual(true);
                    expect(match(nonMatchingPoint)).toEqual(true);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(false);
                    expect(match(multiPolygonWithHoles)).toEqual(false);
                });
            });

            describe('MultiPolygon argument', () => {
                const data = multiPolygon;

                it('with relations set to "within"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Within})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {
                            data1: data
                        }
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(true);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(true);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(true);
                    expect(match(pointNotInQueryPoint)).toEqual(true);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(true);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(true);
                });

                it('relations set to "contains"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(false);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(false);
                });

                it('with relations set to "intersects"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(true);
                    expect(match(polyDisjointQueryPoints)).toEqual(true);
                    expect(match(polyIntersectQueryPoints)).toEqual(true);
                    expect(match(polyWithinQueryPoints)).toEqual(true);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(true);
                    expect(match(pointNotInQueryPoint)).toEqual(true);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(true);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(true);
                });

                it('with relations set to "disjoint"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(false);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(true);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(false);
                    expect(match(multiPolygonWithHoles)).toEqual(false);
                });
            });

            describe('MultiPolygonWithHoles argument', () => {
                const data = multiPolygonWithHoles;

                it('with relations set to "within"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Within})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {
                            data1: data
                        }
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(true);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(false);
                    expect(match(multiPolygonWithHoles)).toEqual(true);
                });

                it('relations set to "contains"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(false);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(true);
                });

                it('with relations set to "intersects"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(true);
                    expect(match(polyDisjointQueryPoints)).toEqual(true);
                    expect(match(polyIntersectQueryPoints)).toEqual(true);
                    expect(match(polyWithinQueryPoints)).toEqual(true);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(true);
                    expect(match(pointNotInQueryPoint)).toEqual(false);
                    expect(match(nonMatchingPoint)).toEqual(false);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(true);
                    expect(match(multiPolygon)).toEqual(true);
                    expect(match(multiPolygonWithHoles)).toEqual(true);
                });

                it('with relations set to "disjoint"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

                    const { ast } = new Parser(query, {
                        type_config: typeConfig
                    });
                    const { match } = initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: {}
                    });

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toEqual(false);
                    expect(match(polyDisjointQueryPoints)).toEqual(false);
                    expect(match(polyIntersectQueryPoints)).toEqual(false);
                    expect(match(polyWithinQueryPoints)).toEqual(false);

                    // Points
                    expect(match(pointInQueryPoints)).toEqual(false);
                    expect(match(pointNotInQueryPoint)).toEqual(true);
                    expect(match(nonMatchingPoint)).toEqual(true);

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toEqual(false);
                    expect(match(multiPolygon)).toEqual(false);
                    expect(match(multiPolygonWithHoles)).toEqual(false);
                });
            });
        });
    });
});
