/* eslint-disable no-useless-escape */
/* eslint-disable quotes */
import 'jest-extended';
import * as utils from '../src/utils';
import {
    FieldType, GeoShapeType, GeoShapePoint, GeoShapePolygon, GeoShapeMultiPolygon, GeoShapeRelation
} from '../src/interfaces';

// TODO: make test for polygon with holes

describe('Utils', () => {
    it('should have GEO_DISTANCE_UNITS', () => {
        expect(utils.GEO_DISTANCE_UNITS).toBeObject();
    });

    describe('join queries', () => {
        const { createJoinQuery } = utils;

        it('will return an empty string with an empty input object', () => {
            const input = {};
            const results = createJoinQuery(input);

            expect(results).toEqual('');
        });

        it('will do basic "AND" joins with simple values', () => {
            const input = { hello: 'world', goodBye: 'Dave' };
            const results = createJoinQuery(input);

            expect(results).toEqual('hello: "world" AND goodBye: "Dave"');
        });

        it('will do basic "OR" joins with simple values', () => {
            const input = { hello: 'world', goodBye: 'Dave', myName: 'isSteve' };
            const options: utils.CreateJoinQueryOptions = { joinBy: 'OR' };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('hello: "world" OR goodBye: "Dave" OR myName: "isSteve"');
        });

        it('values will be escaped properly', () => {
            const input = { hello: 'wor " ld', goodBye: '"Dave"' };
            const results = createJoinQuery(input);

            expect(results).toEqual('hello: "wor \\" ld" AND goodBye: \"\\\"Dave\\\"\"');
        });

        it('array input values default to "AND"', () => {
            const input = { foo: 'bar', baz: [1, 2, 3] };
            const options: utils.CreateJoinQueryOptions = {};
            const results = createJoinQuery(input, options);

            expect(results).toEqual('foo: "bar" AND baz: ("1" AND "2" AND "3")');
        });

        it('duplicate array input values are removed', () => {
            const input = { foo: 'bar', baz: [1, 2, 2, 3, 3, 3] };
            const options: utils.CreateJoinQueryOptions = {};
            const results = createJoinQuery(input, options);

            expect(results).toEqual('foo: "bar" AND baz: ("1" AND "2" AND "3")');
        });

        it('array input values can be set to "OR"', () => {
            const input = { foo: 'bar', baz: [1, 2, 3] };
            const options: utils.CreateJoinQueryOptions = { arrayJoinBy: 'OR' };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('foo: "bar" AND baz: ("1" OR "2" OR "3")');
        });

        it('can make a geoDistance join if field type is set to "geo"', () => {
            const input = { location: '60,90' };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.Geo }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoDistance(point:"60,90" distance:"100m")');
        });

        it('can add additional fieldParams for geoDistance ', () => {
            const input = { location: '60,90' };
            const options: utils.CreateJoinQueryOptions = {
                fieldParams: { location: '50km' },
                typeConfig: { location: FieldType.Geo }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoDistance(point:"60,90" distance:"50km")');
        });

        it('can make a geoDistance join if field type is set to "geoPoint" with geoPoint data', () => {
            const input = { location: '60,90' };
            const options: utils.CreateJoinQueryOptions = {
                fieldParams: { location: '50km' },
                typeConfig: { location: FieldType.GeoPoint }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoDistance(point:"60,90" distance:"50km")');
        });

        it('will return an empty string if field type is set to "geoPoint" with bad data', () => {
            const input = { location: 23452345 };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('');
        });

        it('can make a geo geoDistance join if field type is set to "geoPoint" with GeoJSON point data', () => {
            const data: GeoShapePoint = {
                type: GeoShapeType.Point,
                coordinates: [90, 60]
            };
            const input = {
                location: data
            };
            const options: utils.CreateJoinQueryOptions = {
                fieldParams: { location: '50km' },
                typeConfig: { location: FieldType.GeoPoint }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoDistance(point:"60,90" distance:"50km")');
        });

        it('can make a geo bbox join if field type is set to "geoPoint" with GeoJSON polygon data', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50]]]
            };
            const input = {
                location: data
            };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoPolygon(points:["10, 10","10, 50","50, 50","50, 10"])');
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
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoPolygon(points:["10, 10","10, 50","50, 50","50, 10"]) OR location:geoPolygon(points:["-10, -10","-10, -50","-50, -50","-50, -10"])');
        });

        it('unrecognized geoJSON input with field type is set to "geoPoint" will return an empty string', () => {
            const data = {
                type: 'LineString',
                coordinates: [[1, 1], [3, 5], [6, 8]]
            };
            const input = {
                location: data
            };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoPoint }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('');
        });

        it('will return an empty string if field type is set to "geoJSON" with bad data', () => {
            const input = { location: 23452345 };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('');
        });

        it('can make a geoContainsPoint join if field type is set to "geoJSON" with geoPoint data', () => {
            const input = { location: '60,90' };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoContainsPoint(point:"60,90")');
        });

        it('can make a geoContainsPoint join if field type is set to "geoJSON" with geoJSON point data', () => {
            const data: GeoShapePoint = {
                type: GeoShapeType.Point,
                coordinates: [90, 60]
            };
            const input = {
                location: data
            };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoContainsPoint(point:"60,90")');
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON polygon data', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50]]]
            };
            const input = {
                location: data
            };
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoPolygon(points:["10, 10","10, 50","50, 50","50, 10"])');
        });

        it('can make a geoPolygon join if field type is set to "geoJSON" with geoJSON polygon data and fieldParam disjoint', () => {
            const data: GeoShapePolygon = {
                type: GeoShapeType.Polygon,
                coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50]]]
            };
            const input = {
                location: data
            };
            const options: utils.CreateJoinQueryOptions = {
                fieldParams: { location: GeoShapeRelation.Disjoint },
                typeConfig: { location: FieldType.GeoJSON }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoPolygon(points:["10, 10","10, 50","50, 50","50, 10"] relation: "disjoint")');
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
            const options: utils.CreateJoinQueryOptions = {
                typeConfig: { location: FieldType.GeoJSON }
            };
            const results = createJoinQuery(input, options);

            expect(results).toEqual('location:geoPolygon(points:["10, 10","10, 50","50, 50","50, 10"]) OR location:geoPolygon(points:["-10, -10","-10, -50","-50, -50","-50, -10"])');
        });
    });
});
