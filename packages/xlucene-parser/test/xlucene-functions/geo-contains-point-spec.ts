import 'jest-extended';
import {
    xLuceneFieldType, xLuceneTypeConfig, GeoShapeType,
    CoordinateTuple
} from '@terascope/types';
import { debugLogger } from '@terascope/core-utils';
import { Parser, initFunction } from '../../src/index.js';
import { coordinateToXlucene } from '../../src/utils.js';
import { FunctionElasticsearchOptions, FunctionNode } from '../../src/interfaces.js';

describe('geoContainsPoint', () => {
    const typeConfig: xLuceneTypeConfig = { location: xLuceneFieldType.GeoJSON };
    const options: FunctionElasticsearchOptions = {
        logger: debugLogger('test'),
        geo_sort_order: 'asc',
        geo_sort_unit: 'meters',
        type_config: {}
    };

    it('can make a function ast', () => {
        const query = 'location:geoContainsPoint(point:"36.03133177633187,-116.3671875")';

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

        expect(name).toEqual('geoContainsPoint');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    it('can instantiate with variables', () => {
        const variables = {
            point1: { lat: 36.03133177633187, lon: -116.3671875 },
        };
        const query = 'location:geoContainsPoint(point: $point1)';
        const { ast } = new Parser(query, {
            type_config: typeConfig,
            variables
        });

        const {
            name, type, field
        } = ast as FunctionNode;

        const instance = initFunction({
            node: ast as FunctionNode,
            variables,
            type_config: typeConfig
        });

        expect(name).toEqual('geoContainsPoint');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    describe('opensearch dsl', () => {
        it('can produce proper opensearch DSL (variable queries included)', () => {
            expect.hasAssertions();

            const variables = {
                point1: { lat: 36.03133177633187, lon: -116.3671875 },
                point2: '36.03133177633187,-116.3671875',
                point3: {
                    type: GeoShapeType.Point,
                    coordinates: [-116.3671875, 36.03133177633187]
                },
                point4: [-116.3671875, 36.03133177633187]
            };

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
                'location:geoContainsPoint(point: $point1)',
                'location:geoContainsPoint(point: $point2)',
                'location:geoContainsPoint(point: $point3)',
                'location:geoContainsPoint(point: $point4)'
            ];

            const astResults = queries
                .map((query) => (
                    new Parser(query, { type_config: typeConfig, variables })
                ))
                .map((parser) => initFunction({
                    node: (parser.ast as FunctionNode),
                    type_config: typeConfig,
                    variables,
                }).toElasticsearchQuery('location', options));

            astResults.forEach((ast) => {
                expect(ast.query).toEqual(results);
                expect(ast.sort).toBeUndefined();
            });
        });
    });

    describe('matcher', () => {
        const pointInPoly: CoordinateTuple = [15, 15];
        const pointOutOfPoly: CoordinateTuple = [-30, -30];

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

        const polygon = {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
            ]
        };

        const nonMatchingPolygon = {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
            ]
        };

        const polygonWithHoles = {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
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

            const { ast } = new Parser(query, {
                type_config: typeConfig,
            });
            const { match } = initFunction({
                node: ast as FunctionNode,
                type_config: typeConfig,
            });

            expect(match(polygon)).toEqual(true);
            expect(match(nonMatchingPolygon)).toEqual(false);
        });

        it('point can match against a polygon with holes', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast } = new Parser(query, {
                type_config: typeConfig,
            });
            const { match } = initFunction({
                node: ast as FunctionNode,
                type_config: typeConfig,
            });

            expect(match(polygonWithHoles)).toEqual(true);
            expect(match(nonMatchingPolygon)).toEqual(false);
        });

        it('point can match against a multi-polygon', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast } = new Parser(query, {
                type_config: typeConfig,
            });
            const { match } = initFunction({
                node: ast as FunctionNode,
                type_config: typeConfig,
            });

            expect(match(multiPolygon)).toEqual(true);
        });

        it('point can match against a geo_shape point', () => {
            const query = `location:geoContainsPoint(point:${coordinateToXlucene(pointInPoly)})`;

            const { ast } = new Parser(query, {
                type_config: typeConfig,
            });

            const { match } = initFunction({
                node: ast as FunctionNode,
                type_config: typeConfig,
            });

            expect(match(matchingPoint)).toEqual(true);
            expect(match(nonMatchingPoint)).toEqual(false);
        });

        it('matcher can work with variables', () => {
            const variables = {
                point1: matchingPoint
            };
            const query = 'location:geoContainsPoint(point:$point1)';

            const { ast } = new Parser(query, {
                type_config: typeConfig,
                variables
            });

            const { match } = initFunction({
                node: ast as FunctionNode,
                type_config: typeConfig,
                variables
            });

            expect(match(matchingPoint)).toEqual(true);
            expect(match(nonMatchingPoint)).toEqual(false);
        });
    });
});
