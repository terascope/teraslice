
import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser, } from '../../src';
import { UtilsTranslateQueryOptions } from '../../src/translator';
import { TypeConfig, FieldType } from '../../src/interfaces';

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

    describe('elasticsearch dsl', () => {
        it('can produce proper elasticsearch DSL', () => {
            expect.hasAssertions();

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
            ];

            const astResults = queries
                .map((query) => new Parser(query, { type_config: typeConfig }))
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
    });
});
