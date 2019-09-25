
import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser, TypeConfig, FieldType } from '../../src';
import { UtilsTranslateQueryOptions } from '../../src/translator/interfaces';

describe('geo-distance', () => {
    const typeConfig: TypeConfig = { location: FieldType.Geo };
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
        it('can produce proper elasticsearch DSL', () => {
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
