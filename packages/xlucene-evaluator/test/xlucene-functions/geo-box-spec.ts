import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser, } from '../../src';
import { UtilsTranslateQueryOptions } from '../../src/translator';
import { TypeConfig, FieldType, GeoShapeType } from '../../src/interfaces';

describe('geoBox', () => {
    const typeConfig: TypeConfig = { location: FieldType.GeoPoint };
    const options: UtilsTranslateQueryOptions = {
        logger: debugLogger('test'),
        geo_sort_order: 'asc',
        geo_sort_unit: 'meters',
        type_config: {}
    };

    it('can make a function ast', () => {
        const query = 'location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")';
        const {
            ast: {
                name, type, field, instance
            }
        } = new Parser(query, {
            type_config: typeConfig
        });

        expect(name).toEqual('geoBox');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    it('can instantiate with variables', () => {
        const variables = {
            point1: { lat: 32.813646, lon: -111.058902 },
            point2: '33.906320,-112.758421'
        };
        const query = 'location:geoBox(bottom_right: $point1 top_left: $point2)';
        const {
            ast: {
                name, type, field, instance
            }
        } = new Parser(query, {
            type_config: typeConfig,
            variables
        });

        expect(name).toEqual('geoBox');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    describe('elasticsearch dsl', () => {
        it('can produce proper elasticsearch DSL (variable queries included)', () => {
            expect.hasAssertions();
            const variables = {
                point1: { lat: 32.813646, lon: -111.058902 },
                point2: '33.906320,-112.758421',
                point3: {
                    type: GeoShapeType.Point,
                    coordinates: [-111.058902, 32.813646]
                },
                point4: [-112.758421, 33.906320]
            };

            const results = {
                geo_bounding_box: {
                    location: {
                        top_left: {
                            lat: 33.90632,
                            lon: -112.758421
                        },
                        bottom_right: {
                            lat: 32.813646,
                            lon: -111.058902
                        }
                    }
                }
            };

            const queries = [
                'location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")',
                'location: geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")',
                'location:geoBox (bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")',
                'location:geoBox(bottom_right:"32.813646, -111.058902", top_left:"33.906320,-112.758421")',
                "location:geoBox(bottom_right:'32.813646,-111.058902', top_left:'33.906320,-112.758421')",
                'location:geoBox( top_left:"33.906320,-112.758421", bottom_right:"32.813646,-111.058902")',
                'location:geoBox(bottom_right: $point1 top_left: $point2)',
                'location:geoBox(bottom_right: $point3 top_left: $point4)'
            ];

            const astResults = queries
                .map((query) => new Parser(query, { type_config: typeConfig, variables }))
                .map((parser) => parser.ast.instance.toElasticsearchQuery('location', options));

            astResults.forEach((ast) => {
                expect(ast.query).toEqual(results);
                expect(ast.sort).toBeUndefined();
            });
        });
    });

    describe('matcher', () => {
        it('can match results', () => {
            const query = 'location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")';

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            const geoPoint1 = '33,-112';
            const geoPoint2 = '20,100';

            expect(match(geoPoint1)).toEqual(true);
            expect(match(geoPoint2)).toEqual(false);
        });

        it('can match results with variables (object, string)', () => {
            const variables = {
                point1: { lat: 32.813646, lon: -111.058902 },
                point2: '33.906320,-112.758421'
            };
            const query = 'location:geoBox(bottom_right: $point1 top_left: $point2)';
            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig,
                variables
            });

            const geoPoint1 = '33,-112';
            const geoPoint2 = '20,100';

            expect(match(geoPoint1)).toEqual(true);
            expect(match(geoPoint2)).toEqual(false);
        });

        it('can match results with variable (point shape, geo point tuple)', () => {
            const variables = {
                point1: {
                    type: GeoShapeType.Point,
                    coordinates: [-111.058902, 32.813646]
                },
                point2: [-112.758421, 33.906320]
            };
            const query = 'location:geoBox(bottom_right: $point1 top_left: $point2)';
            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig,
                variables
            });

            const geoPoint1 = '33,-112';
            const geoPoint2 = '20,100';

            expect(match(geoPoint1)).toEqual(true);
            expect(match(geoPoint2)).toEqual(false);
        });
    });
});
