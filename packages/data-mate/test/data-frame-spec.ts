import 'jest-extended';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeConfig, FieldType, GeoShape,
    GeoShapeType, DataTypeFieldConfig
} from '@terascope/types';
import { bigIntToJSON, cloneDeep, isBigInt } from '@terascope/core-utils';
import { Column, DataFrame } from '../src/index.js';

describe('DataFrame', () => {
    it('should be able to create an empty table using DataFrame#fromJSON', () => {
        const dataFrame = DataFrame.fromJSON({ version: LATEST_VERSION, fields: {} }, []);
        expect(dataFrame).toBeInstanceOf(DataFrame);
        expect(dataFrame.columns).toBeArrayOfSize(0);
        expect(dataFrame.size).toEqual(0);
        expect(dataFrame.toJSON()).toEqual([]);
        expect(dataFrame.id).toBeString();
    });

    it('should be able to create an empty table using DataFrame#empty', () => {
        const dataFrame = DataFrame.empty({ version: LATEST_VERSION, fields: {} });
        expect(dataFrame).toBeInstanceOf(DataFrame);
        expect(dataFrame.columns).toBeArrayOfSize(0);
        expect(dataFrame.size).toEqual(0);
        expect(dataFrame.toJSON()).toEqual([]);
        expect(dataFrame.id).toBeString();
    });

    it('should throw if given two columns with varying lengths', () => {
        expect(() => {
            new DataFrame([
                Column.fromJSON('count', { type: FieldType.Integer }, [1]),
                Column.fromJSON('sum', { type: FieldType.Integer }, [5, 6]),
            ]);
        }).toThrow('All columns in a DataFrame must have the same length of 1, column (index: 1, name: sum) got length of 2');
    });

    it('should be able to rename a data fame', () => {
        const dataFrame = new DataFrame([
            Column.fromJSON('count', { type: FieldType.Integer }, [1]),
        ], { name: 'foo' });

        expect(dataFrame.name).toBe('foo');
        const resultFrame = dataFrame.renameDataFrame('bar');
        expect(dataFrame.id).toBe(resultFrame.id);
        expect(resultFrame.name).toBe('bar');
    });

    it('should handle a single column with one value', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                }
            }
        }, [
            {
                name: 'Billy'
            }
        ]);
        expect(dataFrame.columns).toBeArrayOfSize(1);
        expect(dataFrame.size).toEqual(1);
        expect(dataFrame.toJSON()).toEqual([
            {
                name: 'Billy'
            }
        ]);
    });

    it('should have the same id when forked (and the columns aren\'t changed)', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                }
            }
        }, [
            {
                name: 'Billy'
            }
        ]);
        const resultFrame = dataFrame.fork(dataFrame.columns);
        expect(resultFrame.id).toEqual(dataFrame.id);
    });

    it('should throw a readable error when calling getColumnOrThrow', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                }
            }
        }, [
            {
                name: 'Billy'
            }
        ]);
        expect(() => {
            dataFrame.getColumnOrThrow('unknown' as any);
        }).toThrow('Unknown column unknown in DataFrame');
    });

    it('should throw a readable error when calling getColumnOrThrow and the data frame is named', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                }
            }
        }, [
            {
                name: 'Billy'
            }
        ], {
            name: 'example'
        });
        expect(() => {
            dataFrame.getColumnOrThrow('unknown' as any);
        }).toThrow('Unknown column unknown in example DataFrame');
    });

    it('should handle a single column with null/undefined values', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                }
            }
        }, [
            {
                name: 'Billy'
            },
            {
                name: null
            },
            {
                name: undefined
            },
            {}
        ]);
        expect(dataFrame.columns).toBeArrayOfSize(1);
        expect(dataFrame.size).toEqual(4);
        expect(dataFrame.toJSON()).toEqual([
            {
                name: 'Billy'
            },
            {},
            {},
            {}
        ]);
    });

    it('should handle multiple columns', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                },
                age: {
                    type: FieldType.Short,
                }
            }
        }, [
            {
                name: 'Billy',
                age: 43
            },
            {
                name: null,
                age: 20
            },
            {
                name: 'Jill',
            }
        ]);
        expect(dataFrame.columns).toBeArrayOfSize(2);
        expect(dataFrame.size).toEqual(3);
        expect(dataFrame.toJSON()).toEqual([
            {
                name: 'Billy',
                age: 43
            },
            {
                age: 20
            },
            {
                name: 'Jill'
            }
        ]);
    });

    it('should handle object fields', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                config: {
                    type: FieldType.Object,
                },
                info: {
                    type: FieldType.Object,
                },
                'info.message': {
                    type: FieldType.String,
                },
                'info.status': {
                    type: FieldType.Integer,
                },
                'info.date': {
                    type: FieldType.Date,
                }
            }
        }, [
            {
                config: { foo: 'bar' },
                info: {
                    message: 'some msg',
                    status: 403,
                    date: '1999-01-01T00:00:00.000Z'
                }
            },
            {
                config: { bar: 'foo' },
                info: {
                    message: 'some other msg',
                    status: 100,
                    other_value: 'asd',
                    date: '2000-01-01T00:00:00.000Z'
                }
            },
        ]);
        expect(dataFrame.columns).toBeArrayOfSize(2);
        expect(dataFrame.size).toEqual(2);
        expect(dataFrame.toJSON()).toEqual([
            {
                config: { foo: 'bar' },
                info: {
                    message: 'some msg',
                    status: 403,
                    date: '1999-01-01T00:00:00.000Z'
                }
            },
            {
                config: { bar: 'foo' },
                info: {
                    message: 'some other msg',
                    status: 100,
                    date: '2000-01-01T00:00:00.000Z'
                }
            },
        ]);

        expect(dataFrame.config).toEqual({
            version: 1,
            fields: {
                config: {
                    type: FieldType.Object,
                },
                info: {
                    type: FieldType.Object,
                },
                'info.message': {
                    type: FieldType.String,
                },
                'info.status': {
                    type: FieldType.Integer,
                },
                'info.date': {
                    type: FieldType.Date,
                },
            }
        });
    });

    describe('when manipulating a DataFrame', () => {
        type Person = { name: string; age?: number; friends?: string[] };
        let peopleDataFrame: DataFrame<Person>;

        type DeepObj = {
            _key?: string;
            config?: {
                id?: string;
                name?: string;
                owner?: {
                    id?: string;
                    name?: string;
                };
            };
            states?: { id?: string; name?: string }[];
        };

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
            long?: bigint | number;
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
            },
            {
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

        describe('->select', () => {
            it('should return a new frame with just those columns', () => {
                const resultFrame = peopleDataFrame.select('name', 'age');
                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age']);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->deepSelect', () => {
            it('should return the selected fields with dot notated selectors', () => {
                const resultFrame = deepObjDataFrame.deepSelect([
                    '_key',
                    'config.name',
                    'config.owner.name',
                    'states.name'
                ]);
                expect(resultFrame.toJSON()).toEqual([{
                    _key: 'id-1',
                    config: {
                        name: 'config-1',
                        owner: {
                            name: 'config-owner-name-1'
                        }
                    },
                    states: [{ name: 'state-1' }, { name: 'state-2' }]
                },
                {
                    _key: 'id-2',
                    config: {
                        name: 'config-2',
                        owner: {
                            name: 'config-owner-name-2'
                        }
                    },
                    states: [{ name: 'state-3' }, { name: 'state-4' }]
                }]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should return the selected parent objects', () => {
                const resultFrame = deepObjDataFrame.deepSelect([
                    '_key',
                    'config.name',
                    'config.owner',
                    'states'
                ]);
                expect(resultFrame.toJSON()).toEqual([{
                    _key: 'id-1',
                    config: {
                        name: 'config-1',
                        owner: {
                            id: 'config-owner-1',
                            name: 'config-owner-name-1'
                        }
                    },
                    states: [{}, {}]
                },
                {
                    _key: 'id-2',
                    config: {
                        name: 'config-2',
                        owner: {
                            id: 'config-owner-2',
                            name: 'config-owner-name-2'
                        }
                    },
                    states: [{}, {}]
                }]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should work when selecting all of the nested fields', () => {
                const resultFrame = deepObjDataFrame.deepSelect([
                    'config.id',
                    'config.name',
                    'config.owner.id',
                    'config.owner.name',
                ]);
                expect(resultFrame.toJSON()).toEqual([{
                    config: {
                        id: 'config-1',
                        name: 'config-1',
                        owner: {
                            id: 'config-owner-1',
                            name: 'config-owner-name-1'
                        }
                    },
                },
                {
                    config: {
                        id: 'config-2',
                        name: 'config-2',
                        owner: {
                            id: 'config-owner-2',
                            name: 'config-owner-name-2'
                        }
                    },
                }]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
                expect(resultFrame.getColumnOrThrow('config').id).toEqual(
                    deepObjDataFrame.getColumnOrThrow('config').id
                );
            });
        });

        describe('->selectAt', () => {
            it('should return a new frame with just those columns', () => {
                const resultFrame = peopleDataFrame.selectAt(1, 2);
                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['age', 'friends']);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->compact', () => {
            describe('when no options are given and there is nothing to compact', () => {
                it('should preserve the data from the people frame', () => {
                    const resultFrame = peopleDataFrame.compact();
                    expect(resultFrame.toJSON()).toEqual(peopleDataFrame.toJSON());
                });

                it('should preserve the data from the deep obj frame', () => {
                    const resultFrame = deepObjDataFrame.compact();
                    expect(resultFrame.toJSON()).toEqual(deepObjDataFrame.toJSON());
                });
            });

            describe('when there are duplicate rows to compact', () => {
                let dupePeopleFrame: DataFrame<Person>;
                let dupeDeepObjFrame: DataFrame<DeepObj>;

                beforeAll(() => {
                    dupePeopleFrame = createPeopleDataFrame([
                        {
                            name: 'Jill',
                            age: 39,
                        },
                        {
                            name: 'Billy',
                            age: 47,
                            friends: ['Jill']
                        },
                        {
                            name: 'Jill',
                            friends: ['Frank']
                        },
                        {
                            name: 'Jill',
                            age: 39,
                        },
                        { name: null as any },
                    ]);

                    dupeDeepObjFrame = createDeepObjectDataFrame([{
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
                    },
                    {
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
                    },
                    {
                        _key: 'id-2',
                        config: {
                            id: 'config-2',
                            name: 'config-2',
                            owner: {
                                id: 'config-owner-2',
                                name: 'config-owner-name-2'
                            }
                        },
                        states: [{ id: 'state-3', name: 'state-3' }, { id: 'state-3', name: 'state-3' }]
                    },
                    {
                        _key: 'id-2',
                        config: {
                            id: 'config-2',
                            name: 'config-2',
                        },
                        states: [{ name: 'state-3' }, { id: 'state-3' }]
                    }]);
                });

                it('should compact the data from the people frame', () => {
                    const resultFrame = dupePeopleFrame.compact();
                    expect(resultFrame.toJSON()).toEqual([
                        {
                            name: 'Jill',
                            age: 39,
                        },
                        {
                            name: 'Billy',
                            age: 47,
                            friends: ['Jill']
                        },
                        {
                            name: 'Jill',
                            friends: ['Frank']
                        }
                    ]);
                });

                it('should compact the data from the deep obj frame', () => {
                    const resultFrame = dupeDeepObjFrame.compact();

                    expect(resultFrame.toJSON()).toEqual([{
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
                    },
                    {
                        _key: 'id-2',
                        config: {
                            id: 'config-2',
                            name: 'config-2',
                            owner: {
                                id: 'config-owner-2',
                                name: 'config-owner-name-2'
                            }
                        },
                        states: [{ id: 'state-3', name: 'state-3' }]
                    },
                    {
                        _key: 'id-2',
                        config: {
                            id: 'config-2',
                            name: 'config-2',
                        },
                        states: [{ name: 'state-3' }, { id: 'state-3' }]
                    }]);
                });
            });
        });

        describe('->assign', () => {
            it('should be able to a new frame with the new column', () => {
                const newColName = 'upper_name';

                const colValues = peopleDataFrame
                    .getColumnOrThrow('name')
                    .toJSON();

                const config: DataTypeFieldConfig = { type: FieldType.String };
                const newCol = Column.fromJSON(
                    newColName,
                    config,
                    colValues.map((str) => str?.toUpperCase())
                );

                const resultFrame = peopleDataFrame.assign([newCol]);

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'friends', 'upper_name']);

                expect(resultFrame.size).toEqual(peopleDataFrame.size);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to a new frame with replaced columns', () => {
                const colValues = peopleDataFrame
                    .getColumnOrThrow('name')
                    .toJSON();

                const config: DataTypeFieldConfig = { type: FieldType.String };
                const newCol = Column.fromJSON(
                    'name',
                    config,
                    colValues.map((str) => str?.toUpperCase())
                );
                const resultFrame = peopleDataFrame.assign([newCol]);

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'friends']);

                expect(resultFrame.getColumnOrThrow('name').toJSON()).toEqual([
                    'JILL',
                    'BILLY',
                    'FRANK',
                    'JANE',
                    'NANCY'
                ]);

                expect(resultFrame.size).toEqual(peopleDataFrame.size);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->rename', () => {
            it('should be able to rename a column DataFrame', () => {
                const resultFrame = peopleDataFrame.rename('name', 'other_name');

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['other_name', 'age', 'friends']);

                for (const row of resultFrame) {
                    expect(row).toHaveProperty('other_name');
                    expect(row).not.toHaveProperty('name');
                }

                expect(resultFrame.size).toEqual(peopleDataFrame.size);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->removeEmptyRows', () => {
            it('should be able remove the empty rows', () => {
                const frame = createPeopleDataFrame([
                    { } as Partial<Person> as Person,
                    { name: 'Jill', age: 39 },
                    { friends: [] } as Partial<Person> as Person,
                    { name: null as any } as Partial<Person> as Person,
                ]);
                const resultFrame = frame.removeEmptyRows();

                expect(resultFrame.size).toEqual(2);
                expect(resultFrame.toJSON()).toEqual([
                    { name: 'Jill', age: 39 },
                    { friends: [] }
                ]);
                expect(resultFrame.id).not.toEqual(frame.id);
            });

            it('should be able return the data frame if non exist', () => {
                const resultFrame = peopleDataFrame.removeEmptyRows();

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
            });
        });

        describe('->countEmptyRows', () => {
            it('should be able count the empty rows', () => {
                const frame = createPeopleDataFrame([
                    { } as Partial<Person> as Person,
                    { name: 'Jill', age: 39 },
                    { friends: [] } as Partial<Person> as Person,
                    { name: null as any } as Partial<Person> as Person,
                ]);
                expect(frame.countEmptyRows()).toBe(2);
            });

            it('should be able count the empty rows when there are none', () => {
                expect(peopleDataFrame.countEmptyRows()).toBe(0);
            });
        });

        describe('->hasEmptyRows', () => {
            it('should be able to check if there are empty rows', () => {
                const frame = createPeopleDataFrame([
                    { } as Partial<Person> as Person,
                    { name: 'Jill', age: 39 },
                    { friends: [] } as Partial<Person> as Person,
                    { name: null as any } as Partial<Person> as Person,
                ]);
                expect(frame.hasEmptyRows()).toBeTrue();
            });

            it('should be able to check if there are empty rows when there are none', () => {
                expect(peopleDataFrame.hasEmptyRows()).toBeFalse();
            });
        });

        describe('->limit', () => {
            it('should be able to get the first two rows', () => {
                const resultFrame = peopleDataFrame.limit(2);

                expect(resultFrame.size).toEqual(2);
                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    }
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to get the last row', () => {
                const resultFrame = peopleDataFrame.limit(-1);

                expect(resultFrame.size).toEqual(1);
                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Nancy',
                        age: 10,
                    }
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be work when called with a number greater than the size of frame', () => {
                const resultFrame = peopleDataFrame.limit(peopleDataFrame.size + 10);

                expect(resultFrame.size).toEqual(peopleDataFrame.size);
                expect(resultFrame.id).toEqual(peopleDataFrame.id);
            });
        });

        describe('->slice', () => {
            it('should be able select one row', () => {
                const resultFrame = peopleDataFrame.select('name').slice(0, 1);
                expect(resultFrame.toJSON()).toEqual([{
                    name: 'Jill'
                }]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->concat', () => {
            it('should return the same data frame if the given an empty array', () => {
                const resultFrame = peopleDataFrame.concat([]);

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
            });

            it('should be able to append the existing columns', () => {
                const resultFrame = peopleDataFrame.concat(peopleDataFrame.columns);
                const data = peopleDataFrame.toJSON();
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data)
                );
                expect(resultFrame.size).toEqual(peopleDataFrame.size * 2);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able append other columns from a similar data frames', () => {
                const df1 = createPeopleDataFrame([
                    {
                        name: 'Test1',
                        age: 23,
                        friends: ['Frank']
                    },
                    {
                        name: 'Test2',
                        age: 40,
                        friends: []
                    },
                    {
                        name: 'Test3',
                        age: 90,
                        friends: ['Test1', 'Test2']
                    },
                ]);

                const df2 = createPeopleDataFrame([
                    {
                        name: 'Example1',
                        age: 79,
                        friends: ['Frank', 'Test1']
                    },
                    {
                        name: 'Example2',
                        age: 40,
                        friends: ['Example1']
                    },
                    {
                        name: 'Example3',
                        age: 6,
                        friends: ['Example2']
                    },
                    {
                        name: 'Example4',
                        age: 7,
                        friends: ['Example2']
                    },
                    {
                        name: 'Example5',
                        age: 8,
                        friends: ['Example2']
                    },
                    {
                        name: 'Example6',
                        age: 9,
                        friends: ['Example2']
                    },
                    {
                        name: 'Example7',
                        age: 10,
                        friends: ['Example2']
                    },
                ]);

                const resultFrame = peopleDataFrame
                    .concat(df1.columns)
                    .concat(df2.columns);

                expect(resultFrame.toJSON()).toEqual(
                    peopleDataFrame.toJSON().concat(df1.toJSON(), df2.toJSON())
                );

                expect(resultFrame.size).toEqual(peopleDataFrame.size + df1.size + df2.size);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to concat with ip', () => {
                const ipDTConfig: DataTypeConfig = {
                    version: LATEST_VERSION,
                    fields: {
                        ip: {
                            type: FieldType.IP,
                        },
                    }
                };
                const dt1 = DataFrame.fromJSON<{ ip: string }>(
                    ipDTConfig, [{ ip: '127.0.0.1' }, { ip: '10.0.0.1' }]
                );

                const dt2 = DataFrame.fromJSON<{ ip: string }>(
                    ipDTConfig, [{ ip: '192.168.1.1' }, { ip: '12.30.2.1' }]
                );

                const resultFrame = dt1.concat(dt2.columns);
                expect(resultFrame.toJSON()).toEqual([
                    { ip: '127.0.0.1' },
                    { ip: '10.0.0.1' },
                    { ip: '192.168.1.1' },
                    { ip: '12.30.2.1' }
                ]);
                expect(resultFrame.size).toEqual(4);
            });

            it('should be able to append columns with different lengths', () => {
                const resultFrame = peopleDataFrame.concat(peopleDataFrame.columns.map((col, i) => (
                    col.fork(col.vector.slice(0, i + 1))
                )));

                expect(resultFrame.toJSON()).toEqual([
                    ...peopleDataFrame.toJSON(),
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        age: 47,
                        friends: ['Jill']
                    },
                    {
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.size).toEqual(8);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to append new rows', () => {
                const resultFrame = peopleDataFrame.concat([
                    {
                        name: 'Anna',
                        age: 20,
                    },
                    {
                        name: 'Harry',
                        friends: []
                    }
                ]);

                expect(resultFrame.toJSON()).toEqual(
                    peopleDataFrame.toJSON().concat([
                        {
                            name: 'Anna',
                            age: 20,
                        },
                        {
                            name: 'Harry',
                            friends: []
                        }
                    ] as any[])
                );
                expect(resultFrame.size).toEqual(7);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->orderBy', () => {
            it('should be able to sort name by asc order', () => {
                const resultFrame = peopleDataFrame.orderBy('name');

                expect(resultFrame.toJSON()).toEqual([
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
                        friends: ['Jill']
                    },
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        name: 'Nancy',
                        age: 10
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to sort name by desc order', () => {
                const resultFrame = peopleDataFrame.orderBy('name:desc');

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Nancy',
                        age: 10
                    },
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        name: 'Jane',
                        friends: ['Jill']
                    },
                    {
                        name: 'Frank',
                        age: 20,
                        friends: ['Jill']
                    },
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to sort age by asc order', () => {
                const resultFrame = peopleDataFrame.orderBy('age');

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jane',
                        friends: ['Jill']
                    },
                    {
                        name: 'Nancy',
                        age: 10
                    },
                    {
                        name: 'Frank',
                        age: 20,
                        friends: ['Jill']
                    },
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to sort age by desc order', () => {
                const resultFrame = peopleDataFrame.orderBy('age:desc');

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    },
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        name: 'Frank',
                        age: 20,
                        friends: ['Jill']
                    },
                    {
                        name: 'Nancy',
                        age: 10
                    },
                    {
                        name: 'Jane',
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to sort name:desc and age:desc', () => {
                const resultFrame = peopleDataFrame.orderBy(['name:desc', 'age:desc']);

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
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
                        name: 'Nancy',
                        age: 10
                    },
                    {
                        name: 'Jane',
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->appendAll', () => {
            it('should not doing anything if given an empty array', () => {
                const resultFrame = peopleDataFrame.appendAll([]);

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
            });

            it('should be able to append to an empty frame', () => {
                const empty = DataFrame.empty<Person>(peopleDTConfig);
                const resultFrame = empty.appendAll([peopleDataFrame]);

                expect(resultFrame.toJSON()).toEqual(peopleDataFrame.toJSON());
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
            });

            it('should be able to append itself once', () => {
                const resultFrame = peopleDataFrame.appendAll([peopleDataFrame]);
                const data = peopleDataFrame.toJSON();
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data)
                );
                expect(resultFrame.size).toEqual(peopleDataFrame.size * 2);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to append itself three times', () => {
                const resultFrame = peopleDataFrame.appendAll([
                    peopleDataFrame, peopleDataFrame, peopleDataFrame
                ]);
                const data = peopleDataFrame.toJSON();
                expect(resultFrame.size).toEqual(peopleDataFrame.size * 4);
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data, data, data)
                );
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to append itself four times but limit itself', () => {
                const limitSize = Math.round(peopleDataFrame.size * 3.5);

                const resultFrame = peopleDataFrame.appendAll([
                    peopleDataFrame, peopleDataFrame, peopleDataFrame, peopleDataFrame
                ], limitSize);

                const data = peopleDataFrame.toJSON();
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data, data, data).slice(0, limitSize)
                );
                expect(resultFrame.size).toEqual(limitSize);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to append itself two times and ignore a limit greater than provided size', () => {
                const limitSize = peopleDataFrame.size * 4;

                const resultFrame = peopleDataFrame.appendAll([
                    peopleDataFrame, peopleDataFrame
                ], limitSize);

                expect(resultFrame.size).toEqual(peopleDataFrame.size * 3);

                const data = peopleDataFrame.toJSON();
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data, data)
                );

                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to append itself and limit itself to the original size', () => {
                const limitSize = peopleDataFrame.size;

                const resultFrame = peopleDataFrame.appendAll([
                    peopleDataFrame
                ], limitSize);

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
            });

            it('should be able to append itself but limit itself to 0', () => {
                const limitSize = 0;

                const resultFrame = peopleDataFrame.appendAll([
                    peopleDataFrame
                ], limitSize);

                expect(resultFrame.toJSON()).toEqual([]);
                expect(resultFrame.size).toEqual(limitSize);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to append itself but limit itself to 1', () => {
                const limitSize = 1;

                const resultFrame = peopleDataFrame.appendAll([
                    peopleDataFrame
                ], limitSize);

                expect(resultFrame.toJSON()).toEqual(peopleDataFrame.limit(limitSize).toJSON());
                expect(resultFrame.size).toEqual(limitSize);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should NOT throw the when fields vary', () => {
                expect(() => {
                    peopleDataFrame.appendAll([
                        peopleDataFrame.rename('friends', 'old_friends') as DataFrame<any>
                    ]);
                }).toThrow('Unknown column old_friends in DataFrame');
            });

            it('should be able to append another frame with missing certain fields', () => {
                const inputFrame = peopleDataFrame.rename('friends', 'old_friends') as DataFrame<any>;
                expect(() => {
                    inputFrame.appendAll([
                        peopleDataFrame
                    ]);
                }).toThrow('Unknown column friends in DataFrame');
            });
        });

        describe('->appendOne', () => {
            it('should be able to append to an empty frame', () => {
                const empty = DataFrame.empty<Person>(peopleDTConfig);
                const resultFrame = empty.appendOne(peopleDataFrame);

                expect(resultFrame.toJSON()).toEqual(peopleDataFrame.toJSON());
                expect(resultFrame.id).toEqual(peopleDataFrame.id);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
            });

            it('should be able to append an empty frame', () => {
                const empty = DataFrame.empty<Person>(peopleDTConfig);
                const resultFrame = peopleDataFrame.appendOne(empty);

                expect(resultFrame.toJSON()).toEqual(peopleDataFrame.toJSON());
                expect(resultFrame.id).toEqual(peopleDataFrame.id);
                expect(resultFrame.size).toEqual(peopleDataFrame.size);
            });

            it('should be able to append itself once', () => {
                const resultFrame = peopleDataFrame.appendOne(peopleDataFrame);
                const data = peopleDataFrame.toJSON();
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data)
                );
                expect(resultFrame.size).toEqual(peopleDataFrame.size * 2);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->filterBy', () => {
            it('should be able to filter by a single column', () => {
                const resultFrame = peopleDataFrame.filterBy({
                    name: (value) => value?.includes('ill') === true,
                });

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
                    },
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should return the same frame using fields if nothing is filtered out', () => {
                const resultFrame = peopleDataFrame.filterBy({
                    name: () => true,
                });

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
            });

            it('should be able to filter by a multiple columns', () => {
                const resultFrame = peopleDataFrame.filterBy({
                    name: (value) => value?.includes('ill') === true,
                    age: (value) => value != null && value > 40,
                });

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to filter by using a function', () => {
                const resultFrame = peopleDataFrame.filterBy((row) => {
                    if (!row.name?.includes('ill')) return false;
                    if (row.age != null && row.age <= 40) return false;
                    return true;
                });

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill']
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should return the same frame using a function if nothing is filtered out', () => {
                const resultFrame = peopleDataFrame.filterBy(() => true);

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
            });
        });

        describe('->createTupleFrom', () => {
            it('should be able to to merge all of the columns', () => {
                const resultFrame = peopleDataFrame.createTupleFrom(peopleDataFrame.fields, 'merged');

                expect(resultFrame.config).toEqual({
                    version: peopleDTConfig.version,
                    fields: {
                        ...peopleDTConfig.fields,
                        merged: { type: FieldType.Tuple },
                        'merged.0': peopleDTConfig.fields.name,
                        'merged.1': peopleDTConfig.fields.age,
                        'merged.2': peopleDTConfig.fields.friends,
                    }
                });

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank'],
                        merged: ['Jill', 39, ['Frank']]
                    },
                    {
                        name: 'Billy',
                        age: 47,
                        friends: ['Jill'],
                        merged: ['Billy', 47, ['Jill']]
                    },
                    {
                        name: 'Frank',
                        age: 20,
                        friends: ['Jill'],
                        merged: ['Frank', 20, ['Jill']]
                    },
                    {
                        name: 'Jane',
                        friends: ['Jill'],
                        merged: ['Jane', undefined, ['Jill']]
                    },
                    {
                        name: 'Nancy',
                        age: 10,
                        merged: ['Nancy', 10, undefined]
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });
        });

        describe('->require', () => {
            it('should be able to require a single column', () => {
                const resultFrame = peopleDataFrame.require('age');

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
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
                        name: 'Nancy',
                        age: 10,
                    },
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should be able to require multiple columns', () => {
                const resultFrame = peopleDataFrame.require('friends', 'age');

                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Jill',
                        age: 39,
                        friends: ['Frank']
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
                ]);
                expect(resultFrame.id).not.toEqual(peopleDataFrame.id);
            });

            it('should return the same frame if all fields exists', () => {
                const resultFrame = peopleDataFrame.require('name');

                expect(resultFrame.id).toEqual(peopleDataFrame.id);
            });
        });

        describe('->serializeIterator/->deserializeIterator', () => {
            describe.each([
                'peopleDataFrame',
                'deepObjDataFrame',
                'specialDataFrame',
            ])('when given the %s data frame', (frameKey) => {
                let inputFrame: DataFrame<any>;
                let frame: DataFrame<Record<string, any>>;

                beforeAll(async () => {
                    if (frameKey === 'peopleDataFrame') {
                        inputFrame = peopleDataFrame;
                    } else if (frameKey === 'deepObjDataFrame') {
                        inputFrame = deepObjDataFrame;
                    } else if (frameKey === 'specialDataFrame') {
                        inputFrame = specialDataFrame;
                    } else {
                        throw new Error(`Unknown test DataFrame "${frameKey}"`);
                    }

                    frame = await DataFrame.deserializeIterator(
                        inputFrame.serializeIterator()
                    );
                });

                it('should match the serialize to the correct output', () => {
                    expect(
                        Array.from(inputFrame.serializeIterator()).join('\n')
                    ).toMatchSnapshot();
                });

                it('should match original output of toJSON', () => {
                    expect(frame.toJSON()).toEqual(inputFrame.toJSON());
                });

                it('should match original output of toArray', () => {
                    expect(frame.toArray()).toEqual(inputFrame.toArray());
                });

                it('should match original size', () => {
                    expect(frame.size).toEqual(inputFrame.size);
                });

                it('should match original name', () => {
                    expect(frame.name).toEqual(inputFrame.name);
                });

                it('should match original metadata', () => {
                    const actual = cloneDeep(frame.metadata);
                    if (isBigInt(actual.long)) {
                        actual.long = bigIntToJSON(actual.long);
                    }
                    if (isBigInt(actual.nested?.long)) {
                        actual.nested.long = bigIntToJSON(actual.nested.long);
                    }
                    if (Array.isArray(actual.nested?.arr)) {
                        actual.nested.arr = actual.nested.arr.map(bigIntToJSON);
                    }

                    const expected = cloneDeep(inputFrame.metadata);
                    if (isBigInt(expected.long)) {
                        expected.long = bigIntToJSON(expected.long);
                    }
                    if (isBigInt(expected.nested?.long)) {
                        expected.nested.long = bigIntToJSON(expected.nested.long);
                    }
                    if (Array.isArray(expected.nested?.arr)) {
                        expected.nested.arr = expected.nested.arr.map(bigIntToJSON);
                    }

                    expect(actual).toEqual(expected);
                });

                it('should match original config', () => {
                    expect(frame.config).toEqual(inputFrame.config);
                });
            });
        });

        describe('->serialize/->deserialize', () => {
            describe.each([
                'peopleDataFrame',
                'deepObjDataFrame',
                'specialDataFrame',
            ])('when given the %s data frame', (frameKey) => {
                let inputFrame: DataFrame<any>;
                let frame: DataFrame<Record<string, any>>;

                beforeAll(async () => {
                    if (frameKey === 'peopleDataFrame') {
                        inputFrame = peopleDataFrame;
                    } else if (frameKey === 'deepObjDataFrame') {
                        inputFrame = deepObjDataFrame;
                    } else if (frameKey === 'specialDataFrame') {
                        inputFrame = specialDataFrame;
                    } else {
                        throw new Error(`Unknown test DataFrame "${frameKey}"`);
                    }

                    frame = await DataFrame.deserialize(
                        inputFrame.serialize()
                    );
                });

                it('should match the serialize to the correct output', () => {
                    expect(
                        inputFrame.serialize()
                    ).toMatchSnapshot();
                });

                it('should match original output of toJSON', () => {
                    expect(frame.toJSON()).toEqual(inputFrame.toJSON());
                });

                it('should match original output of toArray', () => {
                    expect(frame.toArray()).toEqual(inputFrame.toArray());
                });

                it('should match original size', () => {
                    expect(frame.size).toEqual(inputFrame.size);
                });

                it('should match original name', () => {
                    expect(frame.name).toEqual(inputFrame.name);
                });

                it('should match original metadata', () => {
                    const actual = cloneDeep(frame.metadata);
                    if (isBigInt(actual.long)) {
                        actual.long = bigIntToJSON(actual.long);
                    }
                    if (isBigInt(actual.nested?.long)) {
                        actual.nested.long = bigIntToJSON(actual.nested.long);
                    }
                    if (Array.isArray(actual.nested?.arr)) {
                        actual.nested.arr = actual.nested.arr.map(bigIntToJSON);
                    }

                    const expected = cloneDeep(inputFrame.metadata);
                    if (isBigInt(expected.long)) {
                        expected.long = bigIntToJSON(expected.long);
                    }
                    if (isBigInt(expected.nested?.long)) {
                        expected.nested.long = bigIntToJSON(expected.nested.long);
                    }
                    if (Array.isArray(expected.nested?.arr)) {
                        expected.nested.arr = expected.nested.arr.map(bigIntToJSON);
                    }

                    expect(actual).toEqual(expected);
                });

                it('should match original config', () => {
                    expect(frame.config).toEqual(inputFrame.config);
                });
            });
        });
    });
});
