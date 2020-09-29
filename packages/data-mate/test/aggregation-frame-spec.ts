import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { FieldType } from '@terascope/types';
import { DataFrame } from '../src';

describe('AggregationFrame', () => {
    type Person = {
        name: string;
        gender: 'F'|'M';
        age: number;
        scores: number[],
        date: string;
    };
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
                scores: {
                    type: FieldType.Integer,
                    array: true
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
                scores: [4, 9, 3],
                date: '2020-09-15T17:39:11.195Z', // base
            },
            {
                name: 'Frank',
                age: 25,
                gender: 'M',
                scores: [2, 4, 19],
                date: '2020-09-15T16:39:11.195Z', // minus one hour
            },
            {
                name: 'Jill',
                age: 40,
                gender: 'F',
                scores: [2, 2, 2],
                date: '2020-09-15T15:39:11.195Z', // minus two hours
            },
            {
                name: 'Anne',
                age: 32,
                gender: 'F',
                scores: [20, 4, 19],
                date: '2020-09-15T15:39:11.195Z', // minus two hours
            },
            {
                name: 'Joey',
                age: 20,
                gender: 'M',
                scores: [50, 4, 19],
                date: '2020-09-13T17:39:11.195Z', // minus two days
            },
            {
                name: 'Nancy',
                age: 84,
                gender: 'F',
                scores: [1, 0, 0],
                date: '2019-09-15T17:39:11.195Z', // minus one year
            },
            {
                name: 'Frank',
                age: 45,
                gender: 'M',
                scores: [1, 0, 0],
                date: '2020-07-15T16:39:11.195Z', // minus two months
            },
            {
                name: 'Nick',
                age: null as any,
                gender: null as any,
                scores: [1, 1, 10, null as any],
                date: '2018-01-15T10:39:11.195Z', // minus 2 years
            },
        ]);
    });

    describe('->sum(age)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.sum('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 154,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 'Jill',
                    age: 156,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z'
                }
            ]);
        });
    });

    describe('->sum(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.sum('scores').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    scores: 177,
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->avg(age)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.avg('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 38.5,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 'Jill',
                    age: 52,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z'
                }
            ]);
        });

        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.avg('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 44.285714285714285,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->avg(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.avg('scores').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    scores: 7.375,
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->min(age)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.min('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Joey',
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z'
                },
                {
                    name: 'Anne',
                    age: 32,
                    gender: 'F',
                    scores: [20, 4, 19],
                    date: '2020-09-15T15:39:11.195Z'
                }
            ]);
        });

        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.min('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Joey',
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->min(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.min('scores').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Nancy',
                    age: 84,
                    gender: 'F',
                    scores: 0,
                    date: '2019-09-15T17:39:11.195Z',
                }
            ]);
        });
    });

    describe('->max(age)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.max('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 'Nancy',
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z',
                }
            ]);
        });

        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.max('age').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Nancy',
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z',
                }
            ]);
        });
    });

    describe('->max(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.max('scores').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Joey',
                    age: 20,
                    gender: 'M',
                    scores: 50,
                    date: '2020-09-13T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->count(name)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.count('name').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 4,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 3,
                    age: 40,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z'
                }
            ]);
        });

        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.count('name').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 8,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->unique(name)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.unique('name').run()
            );

            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z',
                },
                {
                    name: 'Frank',
                    age: 25,
                    gender: 'M',
                    scores: [2, 4, 19],
                    date: '2020-09-15T16:39:11.195Z',
                },
                {
                    name: 'Jill',
                    age: 40,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z',
                },
                {
                    name: 'Anne',
                    age: 32,
                    gender: 'F',
                    scores: [20, 4, 19],
                    date: '2020-09-15T15:39:11.195Z',
                },
                {
                    name: 'Joey',
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z',
                },
                {
                    name: 'Nancy',
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z',
                },
                {
                    name: 'Nick',
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });

        it('should get the right result when using it with count(name)', async () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame(
                await grouped.unique('name').count('name').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 1,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z',
                },
                {
                    name: 2,
                    age: 25,
                    gender: 'M',
                    scores: [2, 4, 19],
                    date: '2020-09-15T16:39:11.195Z',
                },
                {
                    name: 1,
                    age: 40,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z',
                },
                {
                    name: 1,
                    age: 32,
                    gender: 'F',
                    scores: [20, 4, 19],
                    date: '2020-09-15T15:39:11.195Z',
                },
                {
                    name: 1,
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z',
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z',
                },
                {
                    name: 1,
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->unique(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.unique('scores').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z',
                },
                {
                    name: 'Frank',
                    age: 25,
                    gender: 'M',
                    scores: [2, 4, 19],
                    date: '2020-09-15T16:39:11.195Z',
                },
                {
                    name: 'Jill',
                    age: 40,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z',
                },
                {
                    name: 'Anne',
                    age: 32,
                    gender: 'F',
                    scores: [20, 4, 19],
                    date: '2020-09-15T15:39:11.195Z',
                },
                {
                    name: 'Joey',
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z',
                },
                {
                    name: 'Nancy',
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z',
                },
                {
                    name: 'Nick',
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->hourly(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.hourly('date').count('name').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 1,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 1,
                    age: 25,
                    gender: 'M',
                    scores: [2, 4, 19],
                    date: '2020-09-15T16:39:11.195Z'
                },
                {
                    name: 2,
                    age: 40,
                    gender: 'F',
                    scores: [2, 2, 2],
                    date: '2020-09-15T15:39:11.195Z'
                },
                {
                    name: 1,
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z'
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z'
                },
                {
                    name: 1,
                    age: 45,
                    gender: 'M',
                    scores: [1, 0, 0],
                    date: '2020-07-15T16:39:11.195Z'
                },
                {
                    name: 1,
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->daily(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.daily('date').count('name', 'count').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    count: 4,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 'Joey',
                    count: 1,
                    age: 20,
                    gender: 'M',
                    scores: [50, 4, 19],
                    date: '2020-09-13T17:39:11.195Z'
                },
                {
                    name: 'Nancy',
                    count: 1,
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z'
                },
                {
                    name: 'Frank',
                    count: 1,
                    age: 45,
                    gender: 'M',
                    scores: [1, 0, 0],
                    date: '2020-07-15T16:39:11.195Z'
                },
                {
                    name: 'Nick',
                    count: 1,
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->monthly(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.monthly('date').count('name').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 5,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 1,
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z'
                },
                {
                    name: 1,
                    age: 45,
                    gender: 'M',
                    scores: [1, 0, 0],
                    date: '2020-07-15T16:39:11.195Z'
                },
                {
                    name: 1,
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->yearly(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = new DataFrame(
                await grouped.yearly('date').count('name', 'count').run()
            );
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    count: 6,
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                },
                {
                    name: 'Nancy',
                    count: 1,
                    age: 84,
                    gender: 'F',
                    scores: [1, 0, 0],
                    date: '2019-09-15T17:39:11.195Z'
                },
                {
                    name: 'Nick',
                    count: 1,
                    scores: [1, 1, 10, null],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });
});
