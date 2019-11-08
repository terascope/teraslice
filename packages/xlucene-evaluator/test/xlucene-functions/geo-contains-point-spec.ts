import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser } from '../../src';
import { UtilsTranslateQueryOptions } from '../../src/translator/interfaces';
import { TypeConfig, FieldType } from '../../src/interfaces';

describe('geoContainsPoint', () => {
    const typeConfig: TypeConfig = { location: FieldType.GeoJSON };
    const options: UtilsTranslateQueryOptions = {
        logger: debugLogger('test'),
        geo_sort_order: 'asc',
        geo_sort_unit: 'meters',
    };

    it('can make a function ast', () => {
        const query = 'location:geoContainsPoint(point:"36.03133177633187,-116.3671875")';

        const {
            ast: {
                name, type, field, instance
            }
        } = new Parser(query, {
            type_config: typeConfig
        });

        expect(name).toEqual('geoContainsPoint');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    describe('elasticsearch dsl', () => {
        it('can produce proper elasticsearch DSL', () => {
            expect.hasAssertions();

            const results = {
                geo_shape: {
                    location: {
                        shape: {
                            type: 'point',
                            coordinates: [-116.3671875, 36.03133177633187]
                        },
                        relation: 'intersects'
                    }
                }
            };

            const queries = [
                'location:geoContainsPoint(point:"36.03133177633187,-116.3671875")',
                'location: geoContainsPoint(point:     "36.03133177633187,-116.3671875")',
                'location:geoContainsPoint(point:"36.03133177633187,        -116.3671875")',
                'location:geoContainsPoint(       point:"36.03133177633187,        -116.3671875")',
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
            const query = 'location:geoContainsPoint(point:"36.03133177633187,-116.3671875")';

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            const geoPoints1 = [
                '40.713955826286046, -119.53125',
                '35.17380831799959, -120.58593749999999',
                '31.052933985705163, -116.3671875',
                '35.460669951495305,-110.74218749999999',
                '40.17887331434696,-112.1484375',
                '40.713955826286046, -119.53125'
            ];
            const geoPoints2 = ['50,100', '60,100', '55,75'];

            expect(match(geoPoints1)).toEqual(true);
            expect(match(geoPoints2)).toEqual(false);
        });
    });
});
