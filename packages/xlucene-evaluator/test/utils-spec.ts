/* eslint-disable no-useless-escape */
import 'jest-extended';
import * as utils from '../src/utils';
import {
    FieldType,
    GeoShapeType,
    GeoShapePoint,
    GeoShapePolygon,
    GeoShapeMultiPolygon,
    GeoShapeRelation,
    CreateJoinQueryOptions
} from '../src/interfaces';

// @ts-ignore
const { VariableState, parseGeoPoint } = utils;

describe('Utils', () => {
    it('should have GEO_DISTANCE_UNITS', () => {
        expect(utils.GEO_DISTANCE_UNITS).toBeObject();
    });

    describe('parseGeoPoint', () => {
        it('will not throw if throwInvalid is set to false', () => {
            expect(parseGeoPoint('asdfasdf', false)).toEqual(null);
            // @ts-ignore
            expect(parseGeoPoint({}, false)).toEqual(null);
            // @ts-ignore
            expect(parseGeoPoint(123412341234, false)).toEqual(null);
            // @ts-ignore
            expect(parseGeoPoint([], false)).toEqual(null);
        });

        it('can parse geo-point from a string', () => {
            const results = parseGeoPoint('40, 50');
            expect(results).toEqual({ lat: 40, lon: 50 });
        });

        it('can parse geo-point from a string part 2', () => {
            const results = parseGeoPoint('20,0');
            expect(results).toEqual({ lat: 20, lon: 0 });
        });

        it('can parse geo-point from a object (short hand notation)', () => {
            const results = parseGeoPoint({ lat: 40, lon: 50 });
            expect(results).toEqual({ lat: 40, lon: 50 });
        });

        it('can parse geo-point from a object (long hand notation)', () => {
            const results = parseGeoPoint({ latitude: 40, longitude: 50 });
            expect(results).toEqual({ lat: 40, lon: 50 });
        });

        it('can parse geo-point from a coordinate tuple', () => {
            const results = parseGeoPoint([50, 40]);
            expect(results).toEqual({ lat: 40, lon: 50 });
        });
    });

    describe('VariableState', () => {
        it('can return variables', () => {
            const vState = new VariableState();
            expect(vState.getVariables()).toEqual({});
        });

        it('can set variables', () => {
            const vState = new VariableState();
            const newVariableName = vState.createVariable('hello', 'world');

            expect(newVariableName).toEqual('$hello_1');
            expect(vState.getVariables()).toEqual({ hello_1: 'world' });
        });

        it('can set with same field', () => {
            const vState = new VariableState();
            const newVariableName1 = vState.createVariable('hello', 'world');
            const newVariableName2 = vState.createVariable('hello', 'goodbye');

            expect(newVariableName1).toEqual('$hello_1');
            expect(newVariableName2).toEqual('$hello_2');
            expect(vState.getVariables()).toEqual({ hello_1: 'world', hello_2: 'goodbye' });
        });

        it('can respect existing variables', () => {
            const vState = new VariableState({ hello_1: 'stuff' });
            const newVariableName = vState.createVariable('hello', 'world');

            expect(newVariableName).toEqual('$hello_2');
            expect(vState.getVariables()).toEqual({ hello_1: 'stuff', hello_2: 'world' });
        });

        it('can respect values that are already variables', () => {
            const variables = { person: { some: 'data' } };
            const vState = new VariableState(variables);
            const newVariableName = vState.createVariable('hello', '$person');

            expect(newVariableName).toEqual('$person');
            expect(vState.getVariables()).toEqual(variables);
        });

        it('will throw if value variable is not provided', () => {
            const variables = { other: { some: 'data' } };
            const vState = new VariableState(variables);

            expect(() => vState.createVariable('hello', '$person')).toThrowError('Must provide variable "person" in the variables config');
        });
    });

    describe('join queries', () => {
        const { createJoinQuery } = utils;

        it('will return an empty string with an empty input object', () => {
            const input = {};
            const { query, variables } = createJoinQuery(input);

            expect(query).toEqual('');
            expect(variables).toEqual({});
        });

        it('queries with matching fields have differing variable names', () => {
            const input = { hello: 'world' };
            const { query, variables } = createJoinQuery(input, { variables: { hello_1: 'first' } });

            expect(query).toEqual('hello: $hello_2');
            expect(variables).toEqual({ hello_1: 'first', hello_2: 'world' });
        });

        it('inputs that have variable will be kept', () => {
            const input = { profile: '$person' };
            const { query, variables } = createJoinQuery(input, { variables: { person: 'John' } });

            expect(query).toEqual('profile: $person');
            expect(variables).toEqual({ person: 'John' });
        });

        it('will do basic "AND" joins with simple values', () => {
            const input = { hello: 'world', goodBye: 'Dave' };
            const { query, variables } = createJoinQuery(input);

            expect(query).toEqual('hello: $hello_1 AND goodBye: $goodBye_1');
            expect(variables).toEqual({ hello_1: 'world', goodBye_1: 'Dave' });
        });

        it('will do basic "OR" joins with simple values', () => {
            const input = { hello: 'world', goodBye: 'Dave', myName: 'isSteve' };
            const options: CreateJoinQueryOptions = { joinBy: 'OR' };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('hello: $hello_1 OR goodBye: $goodBye_1 OR myName: $myName_1');
            expect(variables).toEqual({ hello_1: 'world', goodBye_1: 'Dave', myName_1: 'isSteve' });
        });

        it('values will be escaped properly', () => {
            const input = { hello: 'wor " ld', goodBye: '"Dave"' };
            const { query, variables } = createJoinQuery(input);

            expect(query).toEqual('hello: $hello_1 AND goodBye: $goodBye_1');
            expect(variables).toEqual({ hello_1: 'wor " ld', goodBye_1: '"Dave"' });
        });

        it('array input values are passed through', () => {
            const input = { foo: 'bar', baz: [1, 2, 3] };
            const options: CreateJoinQueryOptions = {};
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('foo: $foo_1 AND baz: $baz_1');
            expect(variables).toEqual({ foo_1: 'bar', baz_1: [1, 2, 3] });
        });

        it('can make a geoDistance join if field type is set to "geo"', () => {
            const input = { location: '60,90' };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.Geo }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoDistance(point: $point_1, distance: $distance_1)');
            expect(variables).toEqual({ point_1: input.location, distance_1: '100m' });
        });

        // TODO: this test can be removed when GEO is removed from code
        it('can add additional fieldParams for geoDistance', () => {
            const input = { location: '60,90' };
            const options: CreateJoinQueryOptions = {
                fieldParams: { location: '50km' },
                typeConfig: { location: FieldType.Geo }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoDistance(point: $point_1, distance: $distance_1)');
            expect(variables).toEqual({ point_1: input.location, distance_1: '50km' });
        });

        it('can make a geoDistance join if field type is set to "geoPoint" with geoPoint data', () => {
            const input = { location: '60,90' };
            const options: CreateJoinQueryOptions = {
                fieldParams: { location: '50km' },
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoDistance(point: $point_1, distance: $distance_1)');
            expect(variables).toEqual({ point_1: input.location, distance_1: '50km' });
        });

        it('will return an empty string if field type is set to "geoPoint" with bad data', () => {
            const input = { location: 23452345 };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query } = createJoinQuery(input, options);

            expect(query).toEqual('');
        });

        it('can make a geo geoDistance join if field type is set to "geoPoint" with GeoJSON point data', () => {
            const data: GeoShapePoint = {
                type: GeoShapeType.Point,
                coordinates: [90, 60]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                fieldParams: { location: '50km' },
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoDistance(point: $point_1, distance: $distance_1)');
            expect(variables).toEqual({ point_1: '60,90', distance_1: '50km' });
        });

        it('can make a geo polygon join if field type is set to "geoPoint" with GeoJSON polygon data', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });

        it('can make a geo bbox join if field type is set to "geoPoint" with GeoJSON multipolygon data', () => {
            const data: GeoShapeMultiPolygon = {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [[[10, 10], [50, 10], [50, 50], [10, 50]]],
                    [[[-10, -10], [-50, -10], [-50, -50], [-10, -50]]]
                ]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });

        it('unrecognized geoJSON input with field type is set to "geoPoint" will return an empty string', () => {
            const data = {
                type: 'LineString',
                coordinates: [[1, 1], [3, 5], [6, 8]]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('');
            expect(variables).toEqual({});
        });

        it('will return an empty string if field type is set to "geoJSON" with bad data', () => {
            const input = { location: 23452345 };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('');
            expect(variables).toEqual({});
        });

        it('can make a geoContainsPoint join if field type is set to "geoJSON" with geoPoint data', () => {
            const input = { location: '60,90' };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoContainsPoint(point: $point_1)');
            expect(variables).toEqual({ point_1: '60,90' });
        });

        it('can make a geoContainsPoint join if field type is set to "geoJSON" with geoJSON point data', () => {
            const data: GeoShapePoint = {
                type: GeoShapeType.Point,
                coordinates: [90, 60]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoContainsPoint(point: $point_1)');
            expect(variables).toEqual({ point_1: '60,90' });
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON polygon data', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50]]]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON polygon data and fieldParam disjoint', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50]]]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                fieldParams: { location: GeoShapeRelation.Disjoint },
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1, relation: $relation_1)');
            expect(variables).toEqual({ points_1: input.location, relation_1: 'disjoint' });
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON multipolygon data', () => {
            const data: GeoShapeMultiPolygon = {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [[[10, 10], [50, 10], [50, 50], [10, 50]]],
                    [[[-10, -10], [-50, -10], [-50, -50], [-10, -50]]]
                ]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON polygon data with holes', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                ]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });

        it('can make a geoPolygon join if field type is set to "GeoPoint" with geoJSON polygon data with holes and relation set to disjoint', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                ]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                fieldParams: { location: GeoShapeRelation.Within },
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1, relation: $relation_1)');
            expect(variables).toEqual({ points_1: input.location, relation_1: 'within' });
        });

        it('can make a geoPolygon join if field type is set to "GeoPoint" with geoJSON multipolygon data that has holes', () => {
            const data: GeoShapeMultiPolygon = {
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
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON polygon data with holes and relation set to disjoint', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                ]
            };
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                fieldParams: { location: GeoShapeRelation.Within },
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1, relation: $relation_1)');
            expect(variables).toEqual({ points_1: input.location, relation_1: 'within' });
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON multipolygon data that has holes', () => {
            const data: GeoShapeMultiPolygon = {
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
            const input = {
                location: data
            };
            const options: CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const { query, variables } = createJoinQuery(input, options);

            expect(query).toEqual('location:geoPolygon(points: $points_1)');
            expect(variables).toEqual({ points_1: input.location });
        });
    });
});
