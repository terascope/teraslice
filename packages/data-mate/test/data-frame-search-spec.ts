import 'jest-extended';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeConfig, FieldType, GeoShape, GeoShapeType
} from '@terascope/types';
import { DataFrame } from '../src';

describe('DataFrame', () => {
    type Person = { name: string; age?: number; friends?: string[] }
    let peopleDataFrame: DataFrame<Person>;

    type DeepObj = {
        _key?: string;
        config?: {
            id?: string;
            name?: string;
            owner?: {
                id?: string;
                name?: string;
            }
        };
        states?: { id?: string; name?: string }[];
    }

    const deepObjectDTConfig: DataTypeConfig = {
        version: LATEST_VERSION,
        fields: {
            _key: { type: FieldType.Keyword },
            config: {
                type: FieldType.Object,
            },
            'config.id': {
                type: FieldType.Keyword,
            },
            'config.name': {
                type: FieldType.Keyword,
            },
            'config.owner': {
                type: FieldType.Object,
            },
            'config.owner.name': {
                type: FieldType.Keyword,
            },
            'config.owner.id': {
                type: FieldType.Keyword,
            },
            states: {
                type: FieldType.Object,
                array: true,
                _allow_empty: true
            },
            'states.id': {
                type: FieldType.Keyword,
            },
            'states.name': {
                type: FieldType.Keyword,
            },
        }
    };
    let deepObjDataFrame: DataFrame<DeepObj>;

    const peopleDTConfig: DataTypeConfig = {
        version: LATEST_VERSION,
        fields: {
            name: {
                type: FieldType.Keyword,
            },
            age: {
                type: FieldType.Short,
            },
            friends: {
                type: FieldType.Keyword,
                array: true,
            }
        }
    };
    type Special = {
        ip?: string;
        long?: bigint|number;
        date?: string;
        location?: string;
        geometry?: GeoShape;
    };

    const specialDTConfig: DataTypeConfig = {
        version: LATEST_VERSION,
        fields: {
            ip: { type: FieldType.IP },
            long: { type: FieldType.Long },
            date: { type: FieldType.Date },
            location: { type: FieldType.GeoPoint },
            geometry: { type: FieldType.GeoJSON },
        }
    };
    let specialDataFrame: DataFrame<Special>;

    function createPeopleDataFrame(data: Person[]): DataFrame<Person> {
        return DataFrame.fromJSON<Person>(peopleDTConfig, data);
    }

    function createDeepObjectDataFrame(data: DeepObj[]): DataFrame<DeepObj> {
        return DataFrame.fromJSON<DeepObj>(deepObjectDTConfig, data);
    }

    beforeAll(() => {
        peopleDataFrame = createPeopleDataFrame([
            {
                name: 'Jill',
                age: 39,
                friends: ['Frank'] // sucks for Billy
            },
            {
                name: 'Billy',
                age: 47,
                friends: ['Jill']
            },
            {
                name: 'Frank',
                age: 20,
                friends: ['Jill']
            },
            {
                name: 'Jane',
                age: null as any,
                friends: ['Jill']
            },
            {
                name: 'Nancy',
                age: 10,
                friends: null as any
            },
        ]);
        deepObjDataFrame = createDeepObjectDataFrame([{
            _key: 'id-1',
            config: {
                id: 'config-1',
                name: 'config-1',
                owner: {
                    id: 'config-owner-1',
                    name: 'config-owner-name-1'
                }
            },
            states: [{ id: 'state-1', name: 'state-1' }, { id: 'state-2', name: 'state-2' }]
        }, {
            _key: 'id-2',
            config: {
                id: 'config-2',
                name: 'config-2',
                owner: {
                    id: 'config-owner-2',
                    name: 'config-owner-name-2'
                }
            },
            states: [{ id: 'state-3', name: 'state-3' }, { id: 'state-4', name: 'state-4' }]
        }]);

        specialDataFrame = DataFrame.fromJSON<Special>(specialDTConfig, [
            {
                ip: '127.0.0.1',
                date: '2000-01-04T00:00:00.000Z',
                long: BigInt(10),
                location: '22.435967,-150.867710'
            },
            {
                ip: '10.0.0.2',
                date: '2002-01-02T00:00:00.000Z',
                geometry: {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                    ]
                }
            },
            {
                ip: '192.198.0.1',
                long: BigInt(Number.MAX_SAFE_INTEGER) + BigInt(10),
                date: '1999-12-01T00:00:00.000Z',
                location: '33.435967, -111.867710'
            },
        ], {
            name: 'special',
            metadata: {
                foo: 'bar',
                long: BigInt(1),
                nested: {
                    long: BigInt(1),
                    arr: [BigInt(10), 1, '1']
                }
            }
        });
    });

    it('should be able find all the people by name', () => {
        const resultFrame = peopleDataFrame.search('name:Jill');

        expect(resultFrame.toJSON()).toEqual([
            {
                name: 'Jill',
                age: 39,
                friends: ['Frank'],
            }
        ]);
        expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
    });

    it('should find a value in the friends list', () => {
        const resultFrame = peopleDataFrame.search('friends:Frank');

        expect(resultFrame.toJSON()).toEqual([
            {
                name: 'Jill',
                age: 39,
                friends: ['Frank'],
            }
        ]);
    });

    it('should return nothing if the value cannot be found', () => {
        const resultFrame = peopleDataFrame.search('friends:Missing');

        expect(resultFrame.size).toBe(0);
    });

    it('should be able to match the age using a range', () => {
        const resultFrame = peopleDataFrame
            .search('age:>30')
            .select('name', 'age');

        expect(resultFrame.toJSON()).toEqual([
            { name: 'Jill', age: 39 },
            { name: 'Billy', age: 47 },
        ]);
    });

    it('should be able to match the age using variables', () => {
        const resultFrame = peopleDataFrame
            .search('age:$age', { age: 47 })
            .select('name', 'age');

        expect(resultFrame.toJSON()).toEqual([
            { name: 'Billy', age: 47 },
        ]);
    });

    it('should be able to match using a complicated conjunction', () => {
        const resultFrame = peopleDataFrame
            .search('age:>30 OR (name:Nancy AND age:<30)')
            .select('name', 'age');

        expect(resultFrame.toJSON()).toEqual([
            { name: 'Jill', age: 39 },
            { name: 'Billy', age: 47 },
            { name: 'Nancy', age: 10 }
        ]);
    });

    it('should work with nested objects', () => {
        const resultFrame = deepObjDataFrame
            .search('config.owner.id:config-owner-1')
            .select('_key');

        expect(resultFrame.toJSON()).toEqual([
            { _key: 'id-1' }
        ]);
    });

    it('should be able to match using a IP values', () => {
        const resultFrame = specialDataFrame
            .search('ip:127.0.0.1')
            .select('ip');

        expect(resultFrame.toJSON()).toEqual([
            { ip: '127.0.0.1' },
        ]);
    });

    it('should be able to match using a bigint values', () => {
        const resultFrame = specialDataFrame
            .search('long:10')
            .select('long');

        expect(resultFrame.toJSON()).toEqual([
            { long: 10 },
        ]);
    });

    it('should be able to match using a IP range', () => {
        const resultFrame = specialDataFrame
            .search('ip:"192.198.0.0/24"')
            .select('ip');

        expect(resultFrame.toJSON()).toEqual([
            { ip: '192.198.0.1' },
        ]);
    });

    it('should be able to match using a date values', () => {
        const resultFrame = specialDataFrame
            .search('date:"2000-01-04T00:00:00.000Z"')
            .select('date');

        expect(resultFrame.toJSON()).toEqual([
            { date: '2000-01-04T00:00:00.000Z' },
        ]);
    });

    it('should be able to match using a date range', () => {
        const resultFrame = specialDataFrame
            .search('date:[2001-01-01T00:00:00.000Z TO 2005-01-01T00:00:00.000Z]')
            .select('date');

        expect(resultFrame.toJSON()).toEqual([
            { date: '2002-01-02T00:00:00.000Z' },
        ]);
    });

    it('should be able to match using a geo point', () => {
        const resultFrame = specialDataFrame
            .search('location:geoDistance(point:"33.435518,-111.873616" distance:5000m)')
            .select('location');

        expect(resultFrame.toJSON()).toEqual([
            { location: { lat: 33.435967, lon: -111.867710 } },
        ]);
    });

    it('should be able to match using a geo json', () => {
        const resultFrame = specialDataFrame
            .search('geometry:geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])')
            .select('geometry');

        expect(resultFrame.toJSON()).toEqual([
            {
                geometry: {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[140.43, 70.43], [123.4, 81.3], [154.4, 89.3], [140.43, 70.43]]
                    ]
                }
            },
        ]);
    });
});
