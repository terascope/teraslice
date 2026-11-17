import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import type { QueryCase } from './interfaces.js';

/**
 * Records at the edges where SQL and Elasticsearch read a query differently: times inside a
 * day (`created`), a point on a polygon's edge (`p1`), regexp anchors, booleans in a query with
 * no field, objects with no values (`p5`), a list of objects (`items`), a Long past 2^53 and
 * values with `%` and `_`. Every expected answer is the one OpenSearch gave.
*/
export const edgesDataType = new DataType({
    version: LATEST_VERSION,
    fields: {
        id: { type: FieldType.Keyword },
        name: { type: FieldType.Keyword },
        active: { type: FieldType.Boolean },
        b: { type: FieldType.Byte },
        s: { type: FieldType.Short },
        i: { type: FieldType.Integer },
        l: { type: FieldType.Long },
        d: { type: FieldType.Double },
        f: { type: FieldType.Float },
        created: { type: FieldType.Date },
        ip: { type: FieldType.IP },
        location: { type: FieldType.GeoPoint },
        obj: { type: FieldType.Object },
        'obj.name': { type: FieldType.Keyword },
        items: { type: FieldType.Object, array: true },
        'items.name': { type: FieldType.Keyword },
    },
});

export const edgesTypeConfig = edgesDataType.toXlucene();

export const edgesRecords: readonly Record<string, any>[] = [
    {
        id: 'p1', name: 'alpha', active: true, b: 5, s: -5, i: 1, l: '9007199254740993', d: 1.5, f: 0.3,
        created: '2020-01-15T00:00:00.000Z', ip: '10.0.0.1', location: { lat: 0, lon: 5 },
        obj: { name: 'x' }, items: [{ name: 'x' }],
    },
    {
        id: 'p2', name: 'beta', active: false, b: -3, i: 2, l: '9007199254740992', d: -2.5,
        created: '2020-01-15T12:30:00.000Z', ip: '10.0.0.9', location: { lat: 5, lon: 175 }, items: [],
    },
    {
        id: 'p3', name: '', i: -5, l: -1, d: 0, created: '2020-01-15T23:59:59.999Z', ip: '10.0.1.2',
        location: { lat: 5, lon: 5 },
    },
    { id: 'p4', name: 'a_b%c', created: '2020-01-16T00:00:00.000Z', location: { lat: -5, lon: -175 } },
    { id: 'p5', name: 'gamma', created: '2020-01-01T12:00:00.000Z', obj: { name: null } },
    { id: 'p6' },
    { id: 'p7', name: '1', active: true, i: 10 },
    { id: 'p8', name: 'no', active: false, created: '2020-01-15T12:00:00.000Z' },
];

/**
 * A date bound written to the month, day, minute or second is rounded to that unit, as
 * Elasticsearch rounds it: `gt` and `lte` to its end, `gte` and `lt` to its start. A month is its
 * first day.
*/
export const dateBoundCases: readonly QueryCase[] = [
    ['created:<="2020-01-15"', 'created:<="2020-01-15"', ['p1', 'p2', 'p3', 'p5', 'p8']],
    ['created:<2020-01-16', 'created:<2020-01-16', ['p1', 'p2', 'p3', 'p5', 'p8']],
    ['created:>2020-01-15', 'created:>2020-01-15', ['p4']],
    ['created:>=2020-01-15', 'created:>=2020-01-15', ['p1', 'p2', 'p3', 'p4', 'p8']],
    ['created:[2020-01-15 TO 2020-01-15]', 'created:[2020-01-15 TO 2020-01-15]', ['p1', 'p2', 'p3', 'p8']],
    ['created:{2020-01-14 TO 2020-01-16}', 'created:{2020-01-14 TO 2020-01-16}', ['p1', 'p2', 'p3', 'p8']],
    ['created:<="2020-01-15T12:30"', 'created:<="2020-01-15T12:30"', ['p1', 'p2', 'p5', 'p8']],
    ['created:>"2020-01-15T12:30"', 'created:>"2020-01-15T12:30"', ['p3', 'p4']],
    ['created:2020-01', 'created:2020-01', ['p5']],
    ['created:>="2020-01-15T12:00:00"', 'created:>="2020-01-15T12:00:00"', ['p2', 'p3', 'p4', 'p8']],
    ['created:<"2020-01-15T12:00:00"', 'created:<"2020-01-15T12:00:00"', ['p1', 'p5']],
    ['created:>now-1000y', 'created:>now-1000y', ['p1', 'p2', 'p3', 'p4', 'p5', 'p8']],
    ['created:<now', 'created:<now', ['p1', 'p2', 'p3', 'p4', 'p5', 'p8']],
    ['created:[2020-01-15 TO now]', 'created:[2020-01-15 TO now]', ['p1', 'p2', 'p3', 'p4', 'p8']],
    ['created:"2020-01-15T12:30:00+00:00"', 'created:"2020-01-15T12:30:00+00:00"', ['p2']],
    ['created:<="2020-01"', 'created:<="2020-01"', ['p5']],
    ['created:>"2020-01"', 'created:>"2020-01"', ['p1', 'p2', 'p3', 'p4', 'p8']],
    ['created:>=2020-01', 'created:>=2020-01', ['p1', 'p2', 'p3', 'p4', 'p5', 'p8']],
    ['created:<2020-01', 'created:<2020-01', []],
    ['created:[2020-01 TO 2020-01-15]', 'created:[2020-01 TO 2020-01-15]', ['p1', 'p2', 'p3', 'p5', 'p8']],
];

/**
 * A Lucene regexp has no anchors: `^` and `$` are the characters themselves.
*/
export const regexpCases: readonly QueryCase[] = [
    ['name:/^al.*/', 'name:/^al.*/', []],
    ['name:/al.*/', 'name:/al.*/', ['p1']],
    ['name:/.*pha$/', 'name:/.*pha$/', []],
    ['name:/a.*/', 'name:/a.*/', ['p1', 'p4']],
    ['name:/[^b].*/', 'name:/[^b].*/', ['p1', 'p4', 'p5', 'p7', 'p8']],
    ['name:/[a-z^]+/', 'name:/[a-z^]+/', ['p1', 'p2', 'p5', 'p8']],
];

/**
 * A polygon or box includes a point on its edge.
*/
export const geoEdgeCases: readonly QueryCase[] = [
    ['location:geoPolygon(points:["0,0","0,10","10,10","10,0"])', 'location:geoPolygon(points:["0,0","0,10","10,10","10,0"])', ['p1', 'p3']],
    ['location:geoBox(top_left:"10,0" bottom_right:"0,10")', 'location:geoBox(top_left:"10,0" bottom_right:"0,10")', ['p1', 'p3']],
    ['location:geoDistance(point:"0,5" distance:"1km")', 'location:geoDistance(point:"0,5" distance:"1km")', ['p1']],
];

/**
 * A query with no field: a boolean reads only `true` and `false`, and a list of objects is left
 * out.
*/
export const fieldlessEdgeCases: readonly QueryCase[] = [
    ['1', '1', ['p1', 'p7']],
    ['no', 'no', ['p8']],
    ['true', 'true', ['p1', 'p7']],
    ['alpha', 'alpha', ['p1']],
    ['x', 'x', ['p1']],
    ['beta', 'beta', ['p2']],
    ['5', '5', ['p1']],
    ['false', 'false', ['p2', 'p8']],
    ['0', '0', ['p3']],
    ['yes', 'yes', []],
    ['TRUE', 'TRUE', []],
    ['False', 'False', []],
];

/**
 * An object exists when one of its fields has a value; a list of objects is `nested` in
 * Elasticsearch, so nothing in it matches and it does not exist.
*/
export const objectCases: readonly QueryCase[] = [
    ['obj.name:x', 'obj.name:x', ['p1']],
    ['_exists_:obj', '_exists_:obj', ['p1']],
    ['NOT _exists_:obj', 'NOT _exists_:obj', ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']],
    ['_exists_:obj.name', '_exists_:obj.name', ['p1']],
    ['items.name:x', 'items.name:x', []],
    ['_exists_:items', '_exists_:items', []],
    ['NOT _exists_:items', 'NOT _exists_:items', ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']],
    ['items:x', 'items:x', []],
];

/**
 * Numbers, booleans, empty strings, `%` and `_` in wildcards, field patterns and addresses.
*/
export const scalarEdgeCases: readonly QueryCase[] = [
    ['name:a_b*', 'name:a_b*', ['p4']],
    ['name:"a_b%c"', 'name:"a_b%c"', ['p4']],
    ['name:a?b%c', 'name:a?b%c', ['p4']],
    ['name:*%*', 'name:*%*', ['p4']],
    ['i:1.5', 'i:1.5', ['p1']],
    ['i:>1.5', 'i:>1.5', ['p2', 'p7']],
    ['i:-5', 'i:-5', ['p3']],
    ['i:<-4', 'i:<-4', ['p3']],
    ['b:300', 'b:300', []],
    ['b:>100', 'b:>100', []],
    ['d:1.5', 'd:1.5', ['p1']],
    ['f:0.3', 'f:0.3', ['p1']],
    ['s:-5', 's:-5', ['p1']],
    ['d:>-3', 'd:>-3', ['p1', 'p2', 'p3']],
    ['active:1', 'active:1', ['p1', 'p7']],
    ['active:0', 'active:0', ['p2', 'p8']],
    ['active:"no"', 'active:"no"', ['p2', 'p8']],
    ['active:yes', 'active:yes', ['p1', 'p7']],
    ['active:true', 'active:true', ['p1', 'p7']],
    ['NOT active:true', 'NOT active:true', ['p2', 'p3', 'p4', 'p5', 'p6', 'p8']],
    ['name:""', 'name:""', ['p3']],
    ['NOT _exists_:name', 'NOT _exists_:name', ['p6']],
    ['_exists_:name', '_exists_:name', ['p1', 'p2', 'p3', 'p4', 'p5', 'p7', 'p8']],
    ['na*:alpha', 'na*:alpha', ['p1']],
    ['ip:"10.0.0.0/24"', 'ip:"10.0.0.0/24"', ['p1', 'p2']],
    ['ip:["10.0.0.1" TO "10.0.0.5"]', 'ip:["10.0.0.1" TO "10.0.0.5"]', ['p1']],
    ['ip:"::ffff:10.0.0.1"', 'ip:"::ffff:10.0.0.1"', ['p1']],
];
