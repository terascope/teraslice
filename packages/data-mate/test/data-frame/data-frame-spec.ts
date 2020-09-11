import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { FieldType } from '@terascope/types';
import { DataFrame } from '../../src';

describe('DataFrame', () => {
    it('should be able to create an empty table', () => {
        const dataFrame = DataFrame.fromJSON({ version: LATEST_VERSION, fields: {} }, []);
        expect(dataFrame).toBeInstanceOf(DataFrame);
        expect(dataFrame.columns).toBeArrayOfSize(0);
        expect(dataFrame.size).toEqual(0);
        expect(dataFrame.toJSON()).toEqual([]);
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

    test.todo('should be immutable');

    describe('when manipulating a DataFrame', () => {
        type Person = { name: string; age: number; friends: string[] }
        let dataFrame: DataFrame<Person>;

        beforeEach(() => {
            dataFrame = DataFrame.fromJSON<Person>({
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
            }, [
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
                    name: 'Jill',
                    age: 39,
                    friends: ['Frank'] // sucks for Billy
                }
            ]);
        });

        describe('->select', () => {
            it('should return a new frame with just those columns', () => {
                const selected = dataFrame.select('name', 'age');
                const names = selected.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age']);
                expect(selected.size).toEqual(dataFrame.size);
            });
        });

        describe('->assign', () => {
            it('should be able to a new frame with the new column', () => {
                const newCol = dataFrame.getColumn('name')!.map((str) => {
                    if (str == null) return str;
                    return str.toUpperCase();
                });
                newCol.name = 'upper_name';
                const resultFrame = dataFrame.assign([newCol]);

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'friends', 'upper_name']);

                expect(resultFrame.size).toEqual(dataFrame.size);
            });

            it('should be able to a new frame with replaced columns', () => {
                const newCol = dataFrame.getColumn('name')!.map((str) => {
                    if (str == null) return str;
                    return str.toUpperCase();
                });
                const resultFrame = dataFrame.assign([newCol]);

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'friends']);

                expect(resultFrame.getColumn('name')!.toJSON()).toEqual([
                    'BILLY',
                    'FRANK',
                    'JILL'
                ]);

                expect(resultFrame.size).toEqual(dataFrame.size);
            });
        });

        describe('->rename', () => {
            it('should be able to rename a column DataFrame', () => {
                const resultFrame = dataFrame.rename('friends', 'old_friends');

                const names = resultFrame.columns.map(({ name }) => name);
                expect(names).toEqual(['name', 'age', 'old_friends']);

                for (const row of resultFrame) {
                    expect(row).toHaveProperty('old_friends');
                    expect(row).not.toHaveProperty('friends');
                }

                expect(resultFrame.size).toEqual(dataFrame.size);
            });
        });

        describe('->slice', () => {
            it('should be able to get the first two rows', () => {
                const resultFrame = dataFrame.slice(0, 2);

                expect(resultFrame.size).toEqual(2);
                expect(resultFrame.toJSON()).toEqual(
                    dataFrame.toJSON().slice(0, 2)
                );
            });
        });
    });
});
