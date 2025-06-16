/* eslint-disable jest/no-commented-out-tests */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Parser, initFunction } from '../../src/index.js';
import { FunctionElasticsearchOptions, FunctionNode } from '../../src/interfaces.js';

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
            it('can be produced with array of points', () => {
                expect.hasAssertions();
                // validation of points makes sure that it is enclosed
                const results = {
                    bool: {
                        should: [
                            {
                                bool: {
                                    filter: [
                                        {
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
                                        },
                                        {
                                            bool: {
                                                must_not: []
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                };

                const queries = [
                    'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon (points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon( points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
                    'location:geoPolygon(points:[\'70.43,140.43\', \'81.3,123.4\', \'89.3,154.4\'])',
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

            it('can be produced with variables set to polygons', () => {
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
                                                must_not: []
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

            it('can be produced with variables set to polygons with holes', () => {
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

            it(`will throw when polygon with holes and relation set to ${GeoShapeRelation.Disjoint} against geo-point data`, () => {
                const variables = {
                    points1: {
                        type: GeoShapeType.Polygon,
                        coordinates: [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                            [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                        ]
                    }
                };
                const xQuery = `location: geoPolygon(points: $points1 relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(xQuery, {
                    type_config: typeConfig,
                }).resolveVariables(variables);

                expect(() => {
                    initFunction({
                        node: ast as FunctionNode,
                        variables,
                        type_config: typeConfig
                    });
                }).toThrow('Invalid argument points, when running a disjoint query with a polygon/multi-polygon with holes, it must be against data of type geo-json');
            });

            it('can be produced with variables set to multi-polygons', () => {
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
                                                            must_not: []
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        geo_polygon: {
                                                            location: {
                                                                points: [
                                                                    [-10, -10],
                                                                    [-10, -50],
                                                                    [-50, -50],
                                                                    [-50, -10],
                                                                    [-10, -10]
                                                                ],
                                                            }
                                                        }
                                                    },
                                                    {
                                                        bool: {
                                                            must_not: []
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

            it(`can be produced with variables set to multi-polygons and relation set to ${GeoShapeRelation.Disjoint}`, () => {
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
                const xQuery = `location: geoPolygon(points: $points1 relation: ${GeoShapeRelation.Disjoint})`;

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
                        must: [
                            {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        exists: {
                                                            field: 'location'
                                                        }
                                                    },
                                                    {
                                                        bool: {
                                                            must_not: [
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
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        exists: {
                                                            field: 'location'
                                                        }
                                                    },
                                                    {
                                                        bool: {
                                                            must_not: [
                                                                {
                                                                    geo_polygon: {
                                                                        location: {
                                                                            points: [
                                                                                [-10, -10],
                                                                                [-10, -50],
                                                                                [-50, -50],
                                                                                [-50, -10],
                                                                                [-10, -10]
                                                                            ],
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
                            }
                        ]
                    }
                };

                const { query, sort } = toElasticsearchQuery('location', options);

                expect(query).toEqual(expected);
                expect(sort).toBeUndefined();
            });

            it(`will throw when multi-polygon with holes and relation set to ${GeoShapeRelation.Disjoint} against geo-point data`, () => {
                const variables = {
                    points1: {
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
                    }
                };
                const xQuery = `location: geoPolygon(points: $points1 relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(xQuery, {
                    type_config: typeConfig,
                }).resolveVariables(variables);

                expect(() => {
                    initFunction({
                        node: ast as FunctionNode,
                        variables,
                        type_config: typeConfig
                    });
                }).toThrow('Invalid argument points, when running a disjoint query with a polygon/multi-polygon with holes, it must be against data of type geo-json');
            });
        });

        describe('matcher', () => {
            const data1 = ['70.43,140.43', '81.3,123.4', '89.3,154.4'];

            it('can match points to polygon results', () => {
                const query = 'location: geoPolygon(points:$data1)';

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: { data1 }
                });

                const geoPoint1 = '83.435967,144.867710';
                const geoPoint2 = '-22.435967,-150.867710';

                expect(match(geoPoint1)).toBeTrue();
                expect(match(geoPoint2)).toBeFalse();
            });

            it('can match points to polygon results with relation set to "Within"', () => {
                const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Within})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: { data1 }
                });

                const geoPoint1 = '83.435967,144.867710';
                const geoPoint2 = '-22.435967,-150.867710';

                expect(match(geoPoint1)).toBeTrue();
                expect(match(geoPoint2)).toBeFalse();
            });

            it('can match points to polygon results with relation set to "Intersects"', () => {
                const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: { data1 }
                });

                const geoPoint1 = '83.435967,144.867710';
                const geoPoint2 = '-22.435967,-150.867710';

                expect(match(geoPoint1)).toBeTrue();
                expect(match(geoPoint2)).toBeFalse();
            });

            it('will throw if set to "Contains"', () => {
                const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                expect(() => {
                    initFunction({
                        node: ast as FunctionNode,
                        type_config: typeConfig,
                        variables: { data1 }
                    });
                }).toThrow(`Cannot query against geo-points with relation set to "${GeoShapeRelation.Contains}"`);
            });

            it('can match points to polygon results with relation set to "Disjoint"', () => {
                const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

                const { ast } = new Parser(query, {
                    type_config: typeConfig,
                });
                const { match } = initFunction({
                    node: ast as FunctionNode,
                    type_config: typeConfig,
                    variables: { data1 }
                });

                const geoPoint1 = '83.435967,144.867710';
                const geoPoint2 = '-22.435967,-150.867710';

                expect(match(geoPoint1)).toBeFalse();
                expect(match(geoPoint2)).toBeTrue();
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
                    'location:geoPolygon(points:[\'70.43,140.43\', \'81.3,123.4\', \'89.3,154.4\'])',
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

            const polyWithHoles = {
                type: GeoShapeType.Polygon,
                coordinates: [
                    [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                    [[0, 0], [90, 0], [90, 50], [0, 50], [0, 0]],
                ]
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

            // TODO: Disjoint, poly with holes, multipoly with holes, value in holes => true
            // TODO: Intersect, poly with holes, multipoly with holes, value in holes => false
            // TODO: poly contains multi-polygon, poly with holes

            describe('Polygon argument', () => {
                const data = queryPoints;

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

                    // can take non geo-shape entities
                    expect(match(pointInPoly)).toBeTrue();
                    expect(match('some stuff')).toBeFalse();

                    // Polygons
                    expect(match(polyContainsQueryPoints)).toBeFalse();
                    expect(match(polyDisjointQueryPoints)).toBeFalse();
                    expect(match(polyIntersectQueryPoints)).toBeFalse();
                    expect(match(polyWithinQueryPoints)).toBeTrue();

                    // Points
                    expect(match(pointInQueryPoints)).toBeTrue();
                    expect(match(pointNotInQueryPoint)).toBeFalse();
                    expect(match(nonMatchingPoint)).toBeFalse();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeTrue();
                    expect(match(multiPolygon)).toBeFalse();
                    expect(match(multiPolygonWithHoles)).toBeFalse();
                });

                it('relations set to "contains"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

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
                    expect(match(polyContainsQueryPoints)).toBeTrue();
                    expect(match(polyDisjointQueryPoints)).toBeFalse();
                    expect(match(polyIntersectQueryPoints)).toBeFalse();
                    expect(match(polyWithinQueryPoints)).toBeFalse();

                    // Points
                    expect(match(pointInQueryPoints)).toBeFalse();
                    expect(match(pointNotInQueryPoint)).toBeFalse();
                    expect(match(nonMatchingPoint)).toBeFalse();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeFalse();
                    expect(match(multiPolygon)).toBeTrue();
                    // expect(match(multiPolygonWithHoles)).toBeFalse();
                });

                it('with relations set to "intersects"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

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
                    expect(match(polyContainsQueryPoints)).toBeTrue();
                    expect(match(polyDisjointQueryPoints)).toBeFalse();
                    expect(match(polyIntersectQueryPoints)).toBeTrue();
                    expect(match(polyWithinQueryPoints)).toBeTrue();

                    // Points
                    expect(match(pointInQueryPoints)).toBeTrue();
                    expect(match(pointNotInQueryPoint)).toBeFalse();
                    expect(match(nonMatchingPoint)).toBeFalse();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeTrue();
                    expect(match(multiPolygon)).toBeTrue();
                    // expect(match(multiPolygonWithHoles)).toBeTrue();
                });

                it('with relations set to "disjoint"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

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
                    expect(match(polyContainsQueryPoints)).toBeFalse();
                    expect(match(polyDisjointQueryPoints)).toBeTrue();
                    expect(match(polyIntersectQueryPoints)).toBeFalse();
                    expect(match(polyWithinQueryPoints)).toBeFalse();

                    // Points
                    expect(match(pointInQueryPoints)).toBeFalse();
                    expect(match(pointNotInQueryPoint)).toBeTrue();
                    expect(match(nonMatchingPoint)).toBeTrue();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeFalse();
                    expect(match(multiPolygon)).toBeFalse();
                    // expect(match(multiPolygonWithHoles)).toBeFalse();
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
                    expect(match(polyContainsQueryPoints)).toBeFalse();
                    expect(match(polyDisjointQueryPoints)).toBeTrue();
                    expect(match(polyIntersectQueryPoints)).toBeFalse();
                    expect(match(polyWithinQueryPoints)).toBeTrue();

                    // Points
                    expect(match(pointInQueryPoints)).toBeTrue();
                    expect(match(pointNotInQueryPoint)).toBeTrue();
                    expect(match(nonMatchingPoint)).toBeFalse();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeTrue();
                    expect(match(multiPolygon)).toBeTrue();
                    // expect(match(multiPolygonWithHoles)).toBeTrue();
                });

                it('relations set to "contains"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

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

                    // TODO: rename nonMatchingPoint => lonePoint
                    // TODO: need polyWithHoles
                    // TODO: need Poly contains multiPoly
                    // Polygons
                    expect(match(polyContainsQueryPoints)).toBeFalse();
                    expect(match(polyDisjointQueryPoints)).toBeFalse();
                    expect(match(polyIntersectQueryPoints)).toBeFalse();
                    expect(match(polyWithinQueryPoints)).toBeFalse();

                    // // Points
                    expect(match(pointInQueryPoints)).toBeFalse();
                    expect(match(pointNotInQueryPoint)).toBeFalse();
                    expect(match(nonMatchingPoint)).toBeFalse();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeFalse();
                    expect(match(multiPolygon)).toBeTrue();
                    // expect(match(multiPolygonWithHoles)).toBeFalse();
                });

                it('with relations set to "intersects"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

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
                    expect(match(polyContainsQueryPoints)).toBeTrue();
                    expect(match(polyDisjointQueryPoints)).toBeTrue();
                    expect(match(polyIntersectQueryPoints)).toBeTrue();
                    expect(match(polyWithinQueryPoints)).toBeTrue();

                    // Points
                    expect(match(pointInQueryPoints)).toBeTrue();
                    expect(match(pointNotInQueryPoint)).toBeTrue();
                    expect(match(nonMatchingPoint)).toBeFalse();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeTrue();
                    expect(match(multiPolygon)).toBeTrue();
                    // expect(match(multiPolygonWithHoles)).toBeTrue();
                });

                it('with relations set to "disjoint"', () => {
                    const query = `location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

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
                    expect(match(polyContainsQueryPoints)).toBeFalse();
                    expect(match(polyDisjointQueryPoints)).toBeFalse();
                    expect(match(polyIntersectQueryPoints)).toBeFalse();
                    expect(match(polyWithinQueryPoints)).toBeFalse();

                    // Points
                    expect(match(pointInQueryPoints)).toBeFalse();
                    expect(match(pointNotInQueryPoint)).toBeFalse();
                    expect(match(nonMatchingPoint)).toBeTrue();

                    // MultiPolygons
                    expect(match(smallMultiPolygon)).toBeFalse();
                    expect(match(multiPolygon)).toBeFalse();
                    // expect(match(multiPolygonWithHoles)).toBeFalse();
                });
            });

            // describe('MultiPolygonWithHoles argument', () => {
            //     const data = multiPolygonWithHoles;

            //     it('with relations set to "within"', () => {
            //         const query = `
            // location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Within})`;

            //         const { ast } = new Parser(query, {
            //             type_config: typeConfig
            //         });
            //         const { match } = initFunction({
            //             node: ast as FunctionNode,
            //             type_config: typeConfig,
            //             variables: {
            //                 data1: data
            //             }
            //         });

            //         // // Polygons
            //         // expect(match(polyContainsQueryPoints)).toBeFalse();
            //         // expect(match(polyDisjointQueryPoints)).toBeFalse();
            //         // expect(match(polyIntersectQueryPoints)).toBeFalse();
            //         // expect(match(polyWithinQueryPoints)).toBeFalse();

            //         // // Points
            //         // expect(match(pointInQueryPoints)).toBeTrue();
            //         // expect(match(pointNotInQueryPoint)).toBeFalse();
            //         // expect(match(nonMatchingPoint)).toBeFalse();

            //         // MultiPolygons
            //         // expect(match(smallMultiPolygon)).toBeFalse();
            //         expect(match(multiPolygon)).toBeFalse();
            //         // // expect(match(multiPolygonWithHoles)).toBeTrue();
            //     });

            //     it('relations set to "contains"', () => {
            //         const query = `
            // location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Contains})`;

            //         const { ast } = new Parser(query, {
            //             type_config: typeConfig
            //         });
            //         const { match } = initFunction({
            //             node: ast as FunctionNode,
            //             type_config: typeConfig,
            //             variables: {
            //                 data1: data
            //             }
            //         });

            //         // // Polygons
            //         // expect(match(polyContainsQueryPoints)).toBeFalse();
            //         // expect(match(polyDisjointQueryPoints)).toBeFalse();
            //         // expect(match(polyIntersectQueryPoints)).toBeFalse();
            //         // expect(match(polyWithinQueryPoints)).toBeFalse();

            //         // // Points
            //         // expect(match(pointInQueryPoints)).toBeFalse();
            //         // expect(match(pointNotInQueryPoint)).toBeFalse();
            //         // expect(match(nonMatchingPoint)).toBeFalse();

            //         // // MultiPolygons
            //         // expect(match(smallMultiPolygon)).toBeFalse();
            //         // expect(match(multiPolygon)).toBeTrue();
            //         // // expect(match(multiPolygonWithHoles)).toBeTrue();
            //     });

            //     it('with relations set to "intersects"', () => {
            // const query = `
            // location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Intersects})`;

            //         const { ast } = new Parser(query, {
            //             type_config: typeConfig
            //         });
            //         const { match } = initFunction({
            //             node: ast as FunctionNode,
            //             type_config: typeConfig,
            //             variables: {
            //                 data1: data
            //             }
            //         });

            //         // Polygons
            //         expect(match(polyContainsQueryPoints)).toBeTrue();
            //         expect(match(polyDisjointQueryPoints)).toBeTrue();
            //         expect(match(polyIntersectQueryPoints)).toBeTrue();
            //         expect(match(polyWithinQueryPoints)).toBeTrue();

            //         // Points
            //         expect(match(pointInQueryPoints)).toBeTrue();
            //         expect(match(pointNotInQueryPoint)).toBeFalse();
            //         expect(match(nonMatchingPoint)).toBeFalse();

            //         // MultiPolygons
            //         expect(match(smallMultiPolygon)).toBeTrue();
            //         expect(match(multiPolygon)).toBeTrue();
            //         // expect(match(multiPolygonWithHoles)).toBeTrue();
            //     });

            //     it('with relations set to "disjoint"', () => {
            //         const query = `
            // location: geoPolygon(points:$data1 relation: ${GeoShapeRelation.Disjoint})`;

            //         const { ast } = new Parser(query, {
            //             type_config: typeConfig
            //         });
            //         const { match } = initFunction({
            //             node: ast as FunctionNode,
            //             type_config: typeConfig,
            //             variables: {
            //                 data1: data
            //             }
            //         });

            //         // Polygons
            //         expect(match(polyContainsQueryPoints)).toBeFalse();
            //         expect(match(polyDisjointQueryPoints)).toBeFalse();
            //         expect(match(polyIntersectQueryPoints)).toBeFalse();
            //         expect(match(polyWithinQueryPoints)).toBeFalse();

            //         // Points
            //         expect(match(pointInQueryPoints)).toBeFalse();
            //         expect(match(pointNotInQueryPoint)).toBeTrue();
            //         expect(match(nonMatchingPoint)).toBeTrue();

            //         // MultiPolygons
            //         expect(match(smallMultiPolygon)).toBeFalse();
            //         expect(match(multiPolygon)).toBeFalse();
            //         // expect(match(multiPolygonWithHoles)).toBeFalse();
            //     });
            // });
        });
    });
});
