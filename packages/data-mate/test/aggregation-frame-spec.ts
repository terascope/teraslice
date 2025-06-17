import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { FieldType, Maybe } from '@terascope/types';
import { DataFrame } from '../src/index.js';

describe('AggregationFrame', () => {
    type Person = {
        name: string;
        gender: 'F' | 'M';
        age: number;
        scores: number[];
        date: string;
    };
    let dataFrame: DataFrame<Person>;

    beforeAll(() => {
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
            const resultFrame = await dataFrame
                .aggregate()
                .groupBy(['gender'])
                .sum('age')
                .run();

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

        it('should get the right result when not using groupBy', async () => {
            const resultFrame = await dataFrame
                .aggregate()
                .sum('age')
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 310,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });

        it('should get the right result when using tuple', async () => {
            const grouped = dataFrame.createTupleFrom(['age'], 'age_tuple').aggregate();
            const resultFrame = await grouped.sum('age_tuple').run();
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    age_tuple: 310,
                    gender: 'M',
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->sum(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = await grouped.sum('scores').run();
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

        it('should get the right result when using tuple', async () => {
            const grouped = dataFrame.createTupleFrom(['scores'], 'score_tuple').aggregate();
            const resultFrame = await grouped.sum('score_tuple').run();
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 'M',
                    scores: [4, 9, 3],
                    score_tuple: 177,
                    date: '2020-09-15T17:39:11.195Z'
                }
            ]);
        });
    });

    describe('->avg(age)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const resultFrame = await dataFrame
                .aggregate()
                .groupBy(['gender'])
                .avg('age')
                .run();

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
            const resultFrame = await grouped.avg('age').run();
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
            const resultFrame = await grouped.avg('scores').run();
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
            const resultFrame = await dataFrame
                .aggregate()
                .groupBy('gender')
                .min('age')
                .run();
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
            const resultFrame = await grouped.min('age').run();
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
            const resultFrame = await grouped.min('scores').run();
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
            const resultFrame = await dataFrame
                .aggregate()
                .groupBy('gender')
                .max('age')
                .run();
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
            const resultFrame = await grouped.max('age').run();
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
            const resultFrame = await grouped.max('scores').run();
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
            const resultFrame = await dataFrame
                .aggregate()
                .groupBy('gender')
                .count('name')
                .run();

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
            const resultFrame = await grouped.count('name').run();
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

    describe('->col(gender)->unique()->count(gender)', () => {
        it('should get the right result when using aggregate()', async () => {
            const uniqFrame = dataFrame.assign([
                dataFrame.getColumnOrThrow('gender').unique()
            ]);
            const resultFrame = await uniqFrame.aggregate().count('gender')
                .run();
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 64,
                    gender: 2,
                    scores: [4, 9, 3],
                    date: '2020-09-15T17:39:11.195Z',
                },
            ]);
        });
    });

    describe('->unique(name)', () => {
        it('should get the right result when using groupBy(gender)', async () => {
            const resultFrame = dataFrame.unique(['name', 'gender']);

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
                    scores: [1, 1, 10, undefined],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->unique(scores)', () => {
        it('should get the right result when using aggregate()', async () => {
            const resultFrame = dataFrame.unique('scores');
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
                    scores: [1, 1, 10, undefined],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->hourly(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = await grouped.hourly('date').count('name')
                .run();
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
                    scores: [1, 1, 10, undefined],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->daily(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = await grouped.daily('date').count('name', 'count')
                .run();
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
                    scores: [1, 1, 10, undefined],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->monthly(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = await grouped.monthly('date').count('name')
                .run();
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
                    scores: [1, 1, 10, undefined],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('->yearly(date)', () => {
        it('should get the right result when using aggregate()', async () => {
            const grouped = dataFrame.aggregate();
            const resultFrame = await grouped.yearly('date').count('name', 'count')
                .run();
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
                    scores: [1, 1, 10, undefined],
                    date: '2018-01-15T10:39:11.195Z',
                }
            ]);
        });
    });

    describe('when using the column manipulations', () => {
        it('should handle a complex chain of operations (without sort)', async () => {
            const resultFrame = await dataFrame.aggregate()
                .limit(3)
                .count('name', 'count')
                .monthly('date')
                .rename('name', 'person')
                .select('person', 'count')
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    person: 'Billy',
                    count: 5,
                },
                {
                    person: 'Nancy',
                    count: 1,
                },
                {
                    person: 'Frank',
                    count: 1,
                }
            ]);
        });

        it('should handle a complex chain of operations (with sort)', async () => {
            const resultFrame = await dataFrame.aggregate()
                .monthly('date')
                .count('name', 'count')
                .select('name', 'count')
                .rename('name', 'person')
                .sort('count:asc')
                .limit(3)
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    person: 'Nancy',
                    count: 1,
                },
                {
                    person: 'Frank',
                    count: 1,
                },
                {
                    person: 'Nick',
                    count: 1,
                }
            ]);
        });
    });

    it('should get the right result when using groupBy(gender) without a field agg', async () => {
        const resultFrame = await dataFrame
            .aggregate()
            .groupBy(['gender'])
            .run();

        expect(resultFrame.toJSON()).toEqual([
            {
                name: 'Billy',
                age: 64,
                gender: 'M',
                scores: [4, 9, 3],
                date: '2020-09-15T17:39:11.195Z'
            },
            {
                name: 'Jill',
                age: 40,
                gender: 'F',
                scores: [2, 2, 2],
                date: '2020-09-15T15:39:11.195Z'
            }
        ]);
    });

    describe('when there are duplicate values across the groupBy fields', () => {
        type Person2 = {
            name: Maybe<string>;
            gender: Maybe<'F' | 'M'>;
            age: Maybe<number>;
            friends: Maybe<number>;
        };
        let dataFrame2: DataFrame<Person2>;

        beforeAll(() => {
            dataFrame2 = DataFrame.fromJSON<Person2>({
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
                    friends: {
                        type: FieldType.Short,
                    },
                }
            }, [
                {
                    name: 'Anne',
                    age: null,
                    friends: 20,
                    gender: 'F',
                },
                {
                    name: 'Bill',
                    age: 20,
                    friends: null,
                    gender: 'M',
                },
                {
                    name: 'Nick',
                    age: null,
                    friends: null,
                    gender: null,
                },
            ]);
        });

        it('should create the correct results', async () => {
            const resultFrame = await dataFrame2
                .aggregate()
                .groupBy('age', 'friends')
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Anne',
                    friends: 20,
                    gender: 'F',
                },
                {
                    name: 'Bill',
                    age: 20,
                    gender: 'M',
                }
            ]);
        });
    });

    describe('when avg includes irrational values', () => {
        type Person2 = {
            name: Maybe<string>;
            gender: Maybe<'F' | 'M'>;
            age: Maybe<number>;
            friends: Maybe<number>;
        };
        let dataFrame2: DataFrame<Person2>;

        beforeAll(() => {
            dataFrame2 = DataFrame.fromJSON<Person2>({
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
                    friends: {
                        type: FieldType.Short,
                    },
                }
            }, [
                {
                    name: 'Anne',
                    age: Number.POSITIVE_INFINITY,
                    friends: null,
                    gender: 'F',
                },
                {
                    name: 'Bill',
                    age: Number.NaN,
                    friends: null,
                    gender: 'M',
                }
            ]);
        });

        it('should create the correct results', async () => {
            const resultFrame = await dataFrame2
                .aggregate()
                .avg('age')
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Anne',
                    age: Number.NaN,
                    gender: 'F',
                }
            ]);
        });
    });

    describe('when there are string to numeric conversions (i.e. IP)', () => {
        type Device = {
            ip_address: string;
        };
        let ipDataFrame: DataFrame<Device>;

        beforeAll(() => {
            ipDataFrame = DataFrame.fromJSON<Device>({
                version: LATEST_VERSION,
                fields: {
                    ip_address: {
                        type: FieldType.IP
                    }
                }
            }, [
                // ipv4
                { ip_address: '247.255.255.255' },
                { ip_address: '127.255.255.255' },
                { ip_address: '191.255.255.254' },
                { ip_address: '239.255.255.255' },
                { ip_address: '192.0.0.0' },
                { ip_address: '1.0.0.0' },
                { ip_address: '127.255.255.255' },
                { ip_address: '128.101.240.190' },
                // ipv6
                { ip_address: 'FE80:CD00:0000:0CDE:1257:0000:211E:729C' },
                { ip_address: 'A:B:C:D:E:F:0:0' },
            ]);
        });

        describe('->max(ip_address)', () => {
            it('should get the right result when using aggregate()', async () => {
                const grouped = ipDataFrame.aggregate();
                const resultFrame = await grouped
                    .max('ip_address')
                    .run();

                expect(resultFrame.toJSON()).toEqual([
                    { ip_address: 'FE80:CD00:0000:0CDE:1257:0000:211E:729C' }
                ]);
            });
        });

        describe('->min(ip_address)', () => {
            it('should get the right result when using aggregate()', async () => {
                const grouped = ipDataFrame.aggregate();
                const resultFrame = await grouped
                    .min('ip_address')
                    .run();

                expect(resultFrame.toJSON()).toEqual([
                    { ip_address: '1.0.0.0' }
                ]);
            });
        });
    });

    describe('->mergeBy', () => {
        type Item = {
            name: Maybe<string>;
            state: Maybe<string>;
            fishing?: Maybe<boolean>;
            boating?: Maybe<boolean>;
            swimming?: Maybe<boolean>;
            hiking?: Maybe<boolean>;
            offRoad?: Maybe<boolean>;
        };
        let dataFrame2: DataFrame<Item>;

        beforeAll(() => {
            dataFrame2 = DataFrame.fromJSON<Item>({
                version: LATEST_VERSION,
                fields: {
                    name: {
                        type: FieldType.Keyword,
                    },
                    state: {
                        type: FieldType.Keyword,
                    },
                    fishing: {
                        type: FieldType.Boolean,
                    },
                    boating: {
                        type: FieldType.Boolean,
                    },
                    swimming: {
                        type: FieldType.Boolean,
                    },
                    hiking: {
                        type: FieldType.Boolean,
                    },
                    offRoad: {
                        type: FieldType.Boolean,
                    },
                }
            }, [
                {
                    name: 'some-lake-1',
                    fishing: true,
                    boating: true,
                    swimming: false,
                    offRoad: false,
                    hiking: false,
                    state: 'CA'
                },
                {
                    name: 'some-trail-1',
                    offRoad: true,
                    hiking: false,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'CA'
                },
                {
                    name: 'some-lake-2',
                    fishing: true,
                    boating: false,
                    swimming: true,
                    offRoad: false,
                    hiking: false,
                    state: 'AZ',
                },
                {
                    name: 'some-trail-2',
                    offRoad: false,
                    hiking: true,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'AZ'
                },
                {
                    name: 'some-lake-3',
                    fishing: false,
                    boating: false,
                    swimming: true,
                    offRoad: false,
                    hiking: false,
                    state: 'NY',
                },
                {
                    name: 'some-trail-3',
                    offRoad: true,
                    hiking: true,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'CA'
                },
            ]);
        });

        it('should get the right result', async () => {
            const resultFrame = await dataFrame2
                .aggregate()
                .mergeBy(['state'])
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'some-trail-2',
                    offRoad: false,
                    hiking: true,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'AZ'
                },
                {
                    name: 'some-lake-3',
                    fishing: false,
                    boating: false,
                    swimming: true,
                    offRoad: false,
                    hiking: false,
                    state: 'NY',
                },
                {
                    name: 'some-trail-3',
                    offRoad: true,
                    hiking: true,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'CA'
                },
            ]);
        });

        it('should create the correct results when mergeBy multiple fields', async () => {
            const resultFrame = await dataFrame2
                .aggregate()
                .mergeBy('hiking', 'swimming')
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'some-trail-1',
                    offRoad: true,
                    hiking: false,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'CA'
                },
                {
                    name: 'some-lake-3',
                    fishing: false,
                    boating: false,
                    swimming: true,
                    offRoad: false,
                    hiking: false,
                    state: 'NY',
                },
                {
                    name: 'some-trail-3',
                    offRoad: true,
                    hiking: true,
                    fishing: false,
                    boating: false,
                    swimming: false,
                    state: 'CA'
                },
            ]);
        });

        it('should create the correct results when mergeBy + aggregations', async () => {
            const resultFrame = await dataFrame2
                .aggregate()
                .count('state', 'count')
                .rename('name', 'mainAttraction')
                .mergeBy('state')
                .select('mainAttraction', 'count', 'state')
                .run();

            expect(resultFrame.toJSON()).toEqual([
                {
                    mainAttraction: 'some-trail-2',
                    state: 'AZ',
                    count: 2,
                },
                {
                    mainAttraction: 'some-lake-3',
                    state: 'NY',
                    count: 1,
                },
                {
                    mainAttraction: 'some-trail-3',
                    state: 'CA',
                    count: 3,
                }
            ]);
        });

        it('should throw when running mergeBy -> groupBy', () => {
            expect(() => dataFrame2
                .aggregate()
                .mergeBy('state')
                .count('state', 'count')
                .groupBy('boating')
            ).toThrow('AggregationFrame.groupBy and AggregationFrame.mergeBy running at the same time is not currently supported');
        });

        it('should throw when running groupBy -> mergeBy', () => {
            expect(() => dataFrame2
                .aggregate()
                .groupBy('boating')
                .orderBy('state')
                .mergeBy('state')
            ).toThrow('AggregationFrame.groupBy and AggregationFrame.mergeBy running at the same time is not currently supported');
        });
    });
});
