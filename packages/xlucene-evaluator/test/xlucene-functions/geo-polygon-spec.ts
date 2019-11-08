
import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser } from '../../src';
import { UtilsTranslateQueryOptions, GeoShapeType, GeoShapeRelation } from '../../src/translator/interfaces';
import { TypeConfig, FieldType } from '../../src/interfaces';

describe('geoPolygon', () => {
    describe('with typeconfig field set to GeoPoint', () => {
        const typeConfig: TypeConfig = { location: FieldType.GeoPoint };
        const options: UtilsTranslateQueryOptions = {
            logger: debugLogger('test'),
            geo_sort_order: 'asc',
            geo_sort_unit: 'meters',
        };

        it('can make a function ast', () => {
            const query = 'location:geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

            const {
                ast: {
                    name, type, field, instance
                }
            } = new Parser(query, {
                type_config: typeConfig
            });

            expect(name).toEqual('geoPolygon');
            expect(type).toEqual('function');
            expect(field).toEqual('location');
            expect(instance.match).toBeFunction();
            expect(instance.toElasticsearchQuery).toBeFunction();
        });

        describe('elasticsearch dsl', () => {
            it('can produce elasticsearch DSL', () => {
                expect.hasAssertions();

                const results = {
                    geo_polygon: {
                        location: {
                            points: [
                                {
                                    lat: 70.43,
                                    lon: 140.43
                                },
                                {
                                    lat: 81.3,
                                    lon: 123.4
                                },
                                {
                                    lat: 89.3,
                                    lon: 154.4
                                }
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
                    .map((parser) => parser.ast.instance.toElasticsearchQuery(options));

                astResults.forEach((ast) => {
                    expect(ast.query).toEqual(results);
                    expect(ast.sort).toBeUndefined();
                });
            });
        });

        describe('matcher', () => {
            it('can match results', () => {
                const query = 'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

                const { ast: { instance: { match } } } = new Parser(query, {
                    type_config: typeConfig
                });

                const geoPoint1 = '83.435967,144.867710';
                const geoPoint2 = '-22.435967,-150.867710';

                expect(match(geoPoint1)).toEqual(true);
                expect(match(geoPoint2)).toEqual(false);
            });
        });
    });

    describe('with typeconfig field set to GeoJSON', () => {
        const typeConfig: TypeConfig = { location: FieldType.GeoJSON };
        const options: UtilsTranslateQueryOptions = {
            logger: debugLogger('test'),
            geo_sort_order: 'asc',
            geo_sort_unit: 'meters',
        };

        it('can make a function ast', () => {
            const query = 'location:geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])';

            const {
                ast: {
                    name, type, field, instance
                }
            } = new Parser(query, {
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
                                type: GeoShapeType.Polygon,
                                coordinates: [[[140.43, 70.43], [123.4, 81.3], [154.4, 89.3]]]
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
                    .map((parser) => parser.ast.instance.toElasticsearchQuery(options));

                astResults.forEach((ast) => {
                    expect(ast.query).toEqual(results);
                    expect(ast.sort).toBeUndefined();
                });
            });

            it('can produce elsaticsearch DSL with relation set to within', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [[[140.43, 70.43], [123.4, 81.3], [154.4, 89.3]]]
                            },
                            relation: GeoShapeRelation.Within
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Within}")`;

                const parser = new Parser(query, { type_config: typeConfig });
                const results = parser.ast.instance.toElasticsearchQuery(options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });

            it('can produce elsaticsearch DSL with relation set to intersects', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [[[140.43, 70.43], [123.4, 81.3], [154.4, 89.3]]]
                            },
                            relation: GeoShapeRelation.Intersects
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Intersects}")`;

                const parser = new Parser(query, { type_config: typeConfig });
                const results = parser.ast.instance.toElasticsearchQuery(options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });

            it('can produce elsaticsearch DSL with relation set to contains', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [[[140.43, 70.43], [123.4, 81.3], [154.4, 89.3]]]
                            },
                            relation: GeoShapeRelation.Contains
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Contains}")`;

                const parser = new Parser(query, { type_config: typeConfig });
                const results = parser.ast.instance.toElasticsearchQuery(options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });

            it('can produce elsaticsearch DSL with relation set to disjoint', () => {
                const expectedResults = {
                    geo_shape: {
                        location: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [[[140.43, 70.43], [123.4, 81.3], [154.4, 89.3]]]
                            },
                            relation: GeoShapeRelation.Disjoint
                        }
                    }
                };
                const query = `location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"], relation: "${GeoShapeRelation.Disjoint}")`;

                const parser = new Parser(query, { type_config: typeConfig });
                const results = parser.ast.instance.toElasticsearchQuery(options);

                expect(results.query).toEqual(expectedResults);
                expect(results.sort).toBeUndefined();
            });
        });

        describe('matcher', () => {
            const queryPoints = ['10,10', '10,50', '50,50', '50,10'];
            const containPoints = ['0,0', '0,100', '60,100', '60,0'];
            const withinPoints = ['20,20', '20,30', '30,20'];
            const disjointPoints = ['-10,-10', '-10,-50', '-50,-50', '-50,-10'];
            const intersetPoints = ['0,0', '15,15', '0,15', '15,0'];

            it('default relations matches within', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)})`;

                const { ast: { instance: { match } } } = new Parser(query, {
                    type_config: typeConfig
                });

                expect(match(withinPoints)).toEqual(true);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersetPoints)).toEqual(false);
            });

            it('relations set to within', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Within})`;

                const { ast: { instance: { match } } } = new Parser(query, {
                    type_config: typeConfig
                });

                expect(match(withinPoints)).toEqual(true);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersetPoints)).toEqual(false);
            });

            it('relations set to contains', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Contains})`;

                const { ast: { instance: { match } } } = new Parser(query, {
                    type_config: typeConfig
                });

                expect(match(withinPoints)).toEqual(false);
                expect(match(containPoints)).toEqual(true);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersetPoints)).toEqual(false);
            });

            it('relations set to intersets', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Intersects})`;

                const { ast: { instance: { match } } } = new Parser(query, {
                    type_config: typeConfig
                });

                expect(match(withinPoints)).toEqual(false);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(false);
                expect(match(intersetPoints)).toEqual(true);
            });

            it('relations set to disjoint', () => {
                const query = `location: geoPolygon(points:${JSON.stringify(queryPoints)} relation: ${GeoShapeRelation.Disjoint})`;

                const { ast: { instance: { match } } } = new Parser(query, {
                    type_config: typeConfig
                });

                expect(match(withinPoints)).toEqual(false);
                expect(match(containPoints)).toEqual(false);
                expect(match(disjointPoints)).toEqual(true);
                expect(match(intersetPoints)).toEqual(false);
            });
        });
    });
});
