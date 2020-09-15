import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { FieldType } from '@terascope/types';
import { DataFrame } from '../src';

describe('DataFrame (GroupedData)', () => {
    type Person = { name: string; gender: 'F'|'M', age: number, date: string }
    let dataFrame: DataFrame<Person>;

    beforeEach(() => {
        dataFrame = DataFrame.fromJSON<Person>({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                },
                gender: {
                    type: FieldType.Keyword,
                },
                age: {
                    type: FieldType.Short,
                },
                date: {
                    type: FieldType.Date,
                },
            }
        }, [
            {
                name: 'Billy',
                age: 64,
                gender: 'M',
                date: '2020-09-15T17:39:11.195Z', // base
            },
            {
                name: 'Frank',
                age: 25,
                gender: 'M',
                date: '2020-09-15T16:39:11.195Z', // minus one hour
            },
            {
                name: 'Jill',
                age: 40,
                gender: 'F',
                date: '2020-09-15T15:39:11.195Z', // minus two hours
            },
            {
                name: 'Anne',
                age: 32,
                gender: 'F',
                date: '2020-09-15T15:39:11.195Z', // minus two hours
            },
            {
                name: 'Joey',
                age: 20,
                gender: 'M',
                date: '2020-09-13T17:39:11.195Z', // minus two days
            },
            {
                name: 'Nancy',
                age: 84,
                gender: 'F',
                date: '2019-09-15T17:39:11.195Z', // minus one year
            },
            {
                name: 'Frank',
                age: 45,
                gender: 'M',
                date: '2020-07-15T16:39:11.195Z', // minus two months
            },
        ]);
    });

    describe('->sum', () => {
        it('should get the right result when using groupBy(gender)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.sum('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 154,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 'Jill',
                    age: 156,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->avg', () => {
        it('should get the right result when using groupBy(gender)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.avg('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 38.5,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 'Jill',
                    age: 52,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                }
            ]);
        });

        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.avg('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 44.285714285714285,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->min', () => {
        it('should get the right result when using groupBy(gender)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.min('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 20,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 'Jill',
                    age: 32,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                }
            ]);
        });

        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.min('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 20,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->max', () => {
        it('should get the right result when using groupBy(gender)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.max('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 'Jill',
                    age: 84,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                }
            ]);
        });

        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.max('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Jill',
                    age: 84,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->count', () => {
        it('should get the right result when using groupBy(gender)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 4,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 3,
                    age: 40,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                }
            ]);
        });

        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 7,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->unique', () => {
        it('should get the right result when using groupBy(gender)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.unique('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime(),
                },
                {
                    name: 'Frank',
                    age: 25,
                    gender: 'M',
                    date: new Date('2020-09-15T16:39:11.195Z').getTime(),
                },
                {
                    name: 'Jill',
                    age: 40,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime(),
                },
                {
                    name: 'Anne',
                    age: 32,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime(),
                },
                {
                    name: 'Joey',
                    age: 20,
                    gender: 'M',
                    date: new Date('2020-09-13T17:39:11.195Z').getTime(),
                },
                {
                    name: 'Nancy',
                    age: 84,
                    gender: 'F',
                    date: new Date('2019-09-15T17:39:11.195Z').getTime(),
                }
            ]);
        });

        it('should get the right result when using it with count(name)', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.unique('name').count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 1,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime(),
                },
                {
                    name: 2,
                    age: 25,
                    gender: 'M',
                    date: new Date('2020-09-15T16:39:11.195Z').getTime(),
                },
                {
                    name: 1,
                    age: 40,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime(),
                },
                {
                    name: 1,
                    age: 32,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime(),
                },
                {
                    name: 1,
                    age: 20,
                    gender: 'M',
                    date: new Date('2020-09-13T17:39:11.195Z').getTime(),
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    date: new Date('2019-09-15T17:39:11.195Z').getTime(),
                }
            ]);
        });
    });

    describe('->hourly', () => {
        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.hourly('date').count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 1,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 25,
                    gender: 'M',
                    date: new Date('2020-09-15T16:39:11.195Z').getTime()
                },
                {
                    name: 2,
                    age: 40,
                    gender: 'F',
                    date: new Date('2020-09-15T15:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 20,
                    gender: 'M',
                    date: new Date('2020-09-13T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    date: new Date('2019-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 45,
                    gender: 'M',
                    date: new Date('2020-07-15T16:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->daily', () => {
        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.daily('date').count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 4,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 20,
                    gender: 'M',
                    date: new Date('2020-09-13T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    date: new Date('2019-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 45,
                    gender: 'M',
                    date: new Date('2020-07-15T16:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->monthly', () => {
        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.monthly('date').count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 5,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    date: new Date('2019-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 45,
                    gender: 'M',
                    date: new Date('2020-07-15T16:39:11.195Z').getTime()
                }
            ]);
        });
    });

    describe('->yearly', () => {
        it('should get the right result when using collect()', () => {
            const grouped = dataFrame.collect();
            const resultFrame = new DataFrame({
                columns: grouped.yearly('date').count('name').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 6,
                    age: 64,
                    gender: 'M',
                    date: new Date('2020-09-15T17:39:11.195Z').getTime()
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    date: new Date('2019-09-15T17:39:11.195Z').getTime()
                }
            ]);
        });
    });
});
