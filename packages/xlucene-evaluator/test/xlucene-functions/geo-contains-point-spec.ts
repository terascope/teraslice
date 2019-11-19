import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser } from '../../src';
import { UtilsTranslateQueryOptions } from '../../src/translator/interfaces';
import {
    TypeConfig, FieldType, GeoShapeType, CoordinateTuple
} from '../../src/interfaces';
import { coordinateToXlucene } from '../../src/utils';

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
        const pointInPoly: CoordinateTuple = [15, 15];
        const pointOutOfPoly: CoordinateTuple = [30, 30];

        const multiPolygon = {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]],
                    [[20, 20], [40, 20], [40, 40], [20, 40], [20, 20]]
                ],
                [
                    [[-10, -10], [-50, -10], [-50, -50], [-10, -50], [-10, -10]],
                    [[-20, -20], [-40, -20], [-40, -40], [-20, -40], [-20, -20]]
                ]
            ]
        };

        const polygon = {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]],
            ]
        };

        const nonMatchingPolygon = {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[-10, -10], [-50, -10], [-50, -50], [-10, -50], [-10, -10]],
                [[-20, -20], [-40, -20], [-40, -40], [-20, -40], [-20, -20]]
            ]
        };

        const polygonWithHoles = {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]],
                [[20, 20], [40, 20], [40, 40], [20, 40], [20, 20]]
            ]
        };

        const matchingPoint = {
            type: GeoShapeType.Point,
            coordinates: pointInPoly
        };

        const nonMatchingPoint = {
            type: GeoShapeType.Point,
            coordinates: pointOutOfPoly
        };

        it('point can match against a polygon', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            expect(match(polygon)).toEqual(true);
            expect(match(nonMatchingPolygon)).toEqual(false);
        });

        it('point can match against a polygon with holes', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            expect(match(polygonWithHoles)).toEqual(true);
            expect(match(nonMatchingPolygon)).toEqual(false);
        });

        it('point can match against a multipolygon', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            expect(match(multiPolygon)).toEqual(true);
        });

        it('point can match against a geo_shape point', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            expect(match(matchingPoint)).toEqual(true);
            expect(match(nonMatchingPoint)).toEqual(false);
        });
    });
});
