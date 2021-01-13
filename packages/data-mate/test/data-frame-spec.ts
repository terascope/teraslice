import 'jest-extended';
import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, FieldType } from '@terascope/types';
import { ColumnTransform, DataFrame } from '../src';

describe('DataFrame', () => {
    it('should be able to create an empty table', () => {
        const dataFrame = DataFrame.fromJSON({ version: LATEST_VERSION, fields: {} }, []);
        expect(dataFrame).toBeInstanceOf(DataFrame);
        expect(dataFrame.columns).toBeArrayOfSize(0);
        expect(dataFrame.size).toEqual(0);
        expect(dataFrame.toJSON()).toEqual([]);
        expect(dataFrame.id).toBeString();
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

    it('should be immutable', () => {
        const dataFrame = DataFrame.fromJSON({
            version: LATEST_VERSION,
            fields: {
                name: { type: FieldType.Keyword }
            }
        }, [{ name: 'Billy' }]);

        expect(() => {
            // @ts-expect-error
            dataFrame.columns[0] = 'hi';
        }).toThrow();
    });

    describe('when manipulating a DataFrame', () => {
        type Person = { name: string; age: number; friends: string[] }
        let dataFrame: DataFrame<Person>;

        function createDataFrame(data: Person[]) {
            return DataFrame.fromJSON<Person>({
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
            }, data);
        }

        beforeEach(() => {
            dataFrame = createDataFrame([
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
        });

        describe('->select', () => {
            it('should return a new frame with just those columns', () => {
                const resultFrame = dataFrame.select('name', 'age');
                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age']);
                expect(resultFrame.size).toEqual(dataFrame.size);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->selectAt', () => {
            it('should return a new frame with just those columns', () => {
                const resultFrame = dataFrame.selectAt(1, 2);
                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['age', 'friends']);
                expect(resultFrame.size).toEqual(dataFrame.size);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->assign', () => {
            it('should be able to a new frame with the new column', () => {
                const newCol = dataFrame
                    .getColumnOrThrow('name')
                    .transform(ColumnTransform.toUpperCase)
                    .rename('upper_name');

                const resultFrame = dataFrame.assign([newCol]);

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'friends', 'upper_name']);

                expect(resultFrame.size).toEqual(dataFrame.size);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to a new frame with replaced columns', () => {
                const newCol = dataFrame.getColumnOrThrow('name').transform(ColumnTransform.toUpperCase);
                const resultFrame = dataFrame.assign([newCol]);

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'friends']);

                expect(resultFrame.getColumnOrThrow('name').toJSON()).toEqual([
                    'JILL',
                    'BILLY',
                    'FRANK',
                    'JANE',
                    'NANCY'
                ]);

                expect(resultFrame.size).toEqual(dataFrame.size);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->rename', () => {
            it('should be able to rename a column DataFrame', () => {
                const resultFrame = dataFrame.rename('name', 'other_name');

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['other_name', 'age', 'friends']);

                for (const row of resultFrame) {
                    expect(row).toHaveProperty('other_name');
                    expect(row).not.toHaveProperty('name');
                }

                expect(resultFrame.size).toEqual(dataFrame.size);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->limit', () => {
            it('should be able to get the first two rows', () => {
                const resultFrame = dataFrame.limit(2);

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to get the last row', () => {
                const resultFrame = dataFrame.limit(-1);

                expect(resultFrame.size).toEqual(1);
                expect(resultFrame.toJSON()).toEqual([
                    {
                        name: 'Nancy',
                        age: 10,
                    }
                ]);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be work when called with a number greater than the size of frame', () => {
                const resultFrame = dataFrame.limit(dataFrame.size + 10);

                expect(resultFrame.size).toEqual(dataFrame.size);
                expect(resultFrame.id).toEqual(dataFrame.id);
            });
        });

        describe('->concat', () => {
            it('should return the same data frame if the given an empty array', () => {
                const resultFrame = dataFrame.concat([]);

                expect(resultFrame.id).toEqual(dataFrame.id);
                expect(resultFrame.size).toEqual(dataFrame.size);
            });

            it('should be able to append the existing columns', () => {
                const resultFrame = dataFrame.concat(dataFrame.columns);
                const data = dataFrame.toJSON();
                expect(resultFrame.toJSON()).toEqual(
                    data.concat(data)
                );
                expect(resultFrame.size).toEqual(dataFrame.size * 2);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able append other columns from a similar data frames', () => {
                const df1 = createDataFrame([
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

                const df2 = createDataFrame([
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

                const resultFrame = dataFrame
                    .concat(df1.columns)
                    .concat(df2.columns);

                expect(resultFrame.toJSON()).toEqual(
                    dataFrame.toJSON().concat(df1.toJSON(), df2.toJSON())
                );

                expect(resultFrame.size).toEqual(dataFrame.size + df1.size + df2.size);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to concat with ip', () => {
                const dtConfig: DataTypeConfig = {
                    version: LATEST_VERSION,
                    fields: {
                        ip: {
                            type: FieldType.IP,
                        },
                    }
                };
                const dt1 = DataFrame.fromJSON<{ ip: string }>(
                    dtConfig, [{ ip: '127.0.0.1' }, { ip: '10.0.0.1' }]
                );

                const dt2 = DataFrame.fromJSON<{ ip: string }>(
                    dtConfig, [{ ip: '192.168.1.1' }, { ip: '12.30.2.1' }]
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
                const resultFrame = dataFrame.concat(dataFrame.columns.map((col, i) => (
                    col.fork(col.vector.slice(0, i + 1))
                )));

                expect(resultFrame.toJSON()).toEqual([
                    ...dataFrame.toJSON(),
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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to append new rows', () => {
                const resultFrame = dataFrame.concat([
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
                    dataFrame.toJSON().concat([
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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->orderBy', () => {
            it('should be able to sort name by asc order', () => {
                const resultFrame = dataFrame.orderBy('name');

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to sort name by desc order', () => {
                const resultFrame = dataFrame.orderBy('name:desc');

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to sort age by asc order', () => {
                const resultFrame = dataFrame.orderBy('age');

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to sort age by desc order', () => {
                const resultFrame = dataFrame.orderBy('age:desc');

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to sort name:desc and age:desc', () => {
                const resultFrame = dataFrame.orderBy(['name:desc', 'age:desc']);

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->filterBy', () => {
            it('should be able to filter by a single column', () => {
                const resultFrame = dataFrame.filterBy({
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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should return the same frame using fields if nothing is filtered out', () => {
                const resultFrame = dataFrame.filterBy({
                    name: () => true,
                });

                expect(resultFrame.id).toEqual(dataFrame.id);
            });

            it('should be able to filter by a multiple columns', () => {
                const resultFrame = dataFrame.filterBy({
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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to filter by using a function', () => {
                const resultFrame = dataFrame.filterBy((row) => {
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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should return the same frame using a function if nothing is filtered out', () => {
                const resultFrame = dataFrame.filterBy(() => true);

                expect(resultFrame.id).toEqual(dataFrame.id);
            });
        });

        describe('->createTupleFrom', () => {
            it('should be able to to merge all of the columns', () => {
                const resultFrame = dataFrame.createTupleFrom(dataFrame.fields, 'merged');

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
                        merged: ['Jane', null, ['Jill']]
                    },
                    {
                        name: 'Nancy',
                        age: 10,
                        merged: ['Nancy', 10, null]
                    },
                ]);
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });
        });

        describe('->require', () => {
            it('should be able to require a single column', () => {
                const resultFrame = dataFrame.require('age');

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should be able to require multiple columns', () => {
                const resultFrame = dataFrame.require('friends', 'age');

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
                expect(resultFrame.id).not.toEqual(dataFrame.id);
            });

            it('should return the same frame if all fields exists', () => {
                const resultFrame = dataFrame.require('name');

                expect(resultFrame.id).toEqual(dataFrame.id);
            });
        });
    });
});
