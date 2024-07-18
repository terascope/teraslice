import { RecordAggregator, BatchConfig } from '../src/index.js';

describe('RecordAggregator', () => {
    let data: any;
    let mixedData: any;

    beforeEach(() => {
        data = [
            {
                field: 'value1',
                numbers: [1, 3, 4, 5]
            },
            {
                field: 'value2',
                numbers: [6, 3, 6, 9]
            },
            {
                field: 'value1',
                numbers: [9, 2]
            },
            {
                field: 'value3',
                numbers: [9, 1, 2]
            }
        ];

        mixedData = [
            {
                field: 'value1',
                numbers: [1, 3, 'hello', 4, 5, null]
            },
            {
                field: 'value2',
                numbers: [6, '', 3, 6, 9, undefined, NaN]
            },
            {
                field: 'value1',
                numbers: [9, 'hello', 2]
            },
            {
                field: 'value3',
                numbers: [9, [], 1, {}, 2, { hello: 'world' }]
            },
            {
                field: 'value3',
                numbers: 'other'
            }
        ];
    });

    describe('unique should', () => {
        it('return unique values when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: [1, 3, 4, 5, 6, 9, 2] }
            ];

            expect(RecordAggregator.unique(data, data, config)).toEqual(expectedResults);
        });

        it('should still behave correctly if keys are not on object', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['other'] };
            const expectedResults = [
                { numbers: [1, 3, 4, 5, 6, 9, 2] }
            ];

            expect(RecordAggregator.unique(data, data, config)).toEqual(expectedResults);
        });

        it('return unique values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: [1, 3, 'hello', 4, 5, 6, 9, 2, { hello: 'world' }, 'other'] }
            ];

            expect(RecordAggregator.unique(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { source: 'numbers' };

            expect(
                RecordAggregator.unique({ numbers: null }, { numbers: null }, config)
            ).toEqual([{ numbers: [] }]);

            expect(
                RecordAggregator.unique({ numbers: 'hello' }, { numbers: 'hello' }, config)
            ).toEqual([{ numbers: ['hello'] }]);

            expect(
                RecordAggregator.unique({ numbers: 1234 }, { numbers: 1234 }, config)
            ).toEqual([{ numbers: [1234] }]);

            expect(
                RecordAggregator.unique({ numbers: { hello: 'world' } }, { numbers: { hello: 'world' } }, config)
            ).toEqual([{ numbers: [{ hello: 'world' }] }]);

            expect(RecordAggregator.unique({ hello: 'world' }, { hello: 'world' }, config)).toEqual([{ numbers: [] }]);
            expect(RecordAggregator.unique(null, null, config)).toEqual(null);

            expect(RecordAggregator.unique(['hello', null, 3], ['hello', null, 3], config)).toEqual([{ numbers: [] }]);
        });

        it('return unique values grouped by keys', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: [1, 3, 4, 5, 9, 2]
                },
                {
                    field: 'value2',
                    numbers: [6, 3, 9]
                },
                {
                    field: 'value3',
                    numbers: [9, 1, 2]
                }
            ];

            expect(RecordAggregator.unique(data, data, config)).toEqual(expectedResults);
        });

        it('return unique values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                source: 'numbers',
                keys: ['field'],
                target: 'uniqNumbers'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    uniqNumbers: [1, 3, 4, 5, 9, 2]
                },
                {
                    field: 'value2',
                    uniqNumbers: [6, 3, 9]
                },
                {
                    field: 'value3',
                    uniqNumbers: [9, 1, 2]
                }
            ];

            expect(RecordAggregator.unique(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: [1, 3, 'hello', 4, 5, 9, 2]
                },
                {
                    field: 'value2',
                    numbers: [6, 3, 9]
                },
                {
                    field: 'value3',
                    numbers: [9, 1, 2, { hello: 'world' }, 'other']
                }
            ];

            expect(RecordAggregator.unique(mixedData, mixedData, config)).toEqual(expectedResults);
        });
    });

    describe('count should', () => {
        it('return the number of values when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 13 }
            ];

            expect(RecordAggregator.count(data, data, config)).toEqual(expectedResults);
        });

        it('return the number of values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 17 }
            ];

            expect(RecordAggregator.count(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('return the number of values grouped by keys', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 6
                },
                {
                    field: 'value2',
                    numbers: 4
                },
                {
                    field: 'value3',
                    numbers: 3
                }
            ];

            expect(RecordAggregator.count(data, data, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { source: 'numbers' };

            expect(
                RecordAggregator.count({ numbers: null }, { numbers: null }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(
                RecordAggregator.count({ numbers: 'hello' }, { numbers: 'hello' }, config)
            ).toEqual([{ numbers: 1 }]);

            expect(
                RecordAggregator.count({ numbers: 1234 }, { numbers: 1234 }, config)
            ).toEqual([{ numbers: 1 }]);

            expect(
                RecordAggregator.count({ numbers: { hello: 'world' } }, { numbers: { hello: 'world' } }, config)
            ).toEqual([{ numbers: 1 }]);

            expect(RecordAggregator.count({ hello: 'world' }, { hello: 'world' }, config)).toEqual([{ numbers: 0 }]);
            expect(RecordAggregator.count(null, null, config)).toEqual(null);

            expect(RecordAggregator.count(['hello', null, 3], ['hello', null, 3], config)).toEqual([{ numbers: 0 }]);
        });

        it('return the number of values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                source: 'numbers',
                keys: ['field'],
                target: 'counter'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    counter: 6
                },
                {
                    field: 'value2',
                    counter: 4
                },
                {
                    field: 'value3',
                    counter: 3
                }
            ];

            expect(RecordAggregator.count(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 8
                },
                {
                    field: 'value2',
                    numbers: 4
                },
                {
                    field: 'value3',
                    numbers: 5
                }
            ];

            expect(RecordAggregator.count(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('should not mutate input if source is keyed and target is a different value', () => {
            const config: BatchConfig = { source: 'count', target: 'myCount', keys: ['field', 'count'] };

            const input = [
                { count: 3, field: 'value1' },
                { count: 13, field: 'value2' },
                { count: 3, field: 'value1' },
                { count: 2, field: 'value3' }
            ];

            const expectedResults = [
                { count: 3, field: 'value1', myCount: 2 },
                { count: 13, field: 'value2', myCount: 1 },
                { count: 2, field: 'value3', myCount: 1 }
            ];

            expect(RecordAggregator.count(input, input, config)).toEqual(expectedResults);
        });
    });

    describe('sum should', () => {
        it('return the sum of values when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 60 }
            ];

            expect(RecordAggregator.sum(data, data, config)).toEqual(expectedResults);
        });

        it('return the sum of values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 60 }
            ];

            expect(RecordAggregator.sum(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('return the sum of values grouped by keys', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 24
                },
                {
                    field: 'value2',
                    numbers: 24
                },
                {
                    field: 'value3',
                    numbers: 12
                }
            ];

            expect(RecordAggregator.sum(data, data, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { source: 'numbers' };

            expect(
                RecordAggregator.sum({ numbers: null }, { numbers: null }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(
                RecordAggregator.sum({ numbers: 'hello' }, { numbers: 'hello' }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(
                RecordAggregator.sum({ numbers: 1234 }, { numbers: 1234 }, config)
            ).toEqual([{ numbers: 1234 }]);

            expect(
                RecordAggregator.sum({ numbers: { hello: 'world' } }, { numbers: { hello: 'world' } }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(RecordAggregator.sum({ hello: 'world' }, { hello: 'world' }, config)).toEqual([{ numbers: 0 }]);
            expect(RecordAggregator.sum(null, null, config)).toEqual(null);

            expect(RecordAggregator.sum(['hello', null, 3], ['hello', null, 3], config)).toEqual([{ numbers: 0 }]);
        });

        it('return the sum of values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                source: 'numbers',
                keys: ['field'],
                target: 'sumOfNumbers'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    sumOfNumbers: 24
                },
                {
                    field: 'value2',
                    sumOfNumbers: 24
                },
                {
                    field: 'value3',
                    sumOfNumbers: 12
                }
            ];

            expect(RecordAggregator.sum(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 24
                },
                {
                    field: 'value2',
                    numbers: 24
                },
                {
                    field: 'value3',
                    numbers: 12
                }
            ];

            expect(RecordAggregator.sum(mixedData, mixedData, config)).toEqual(expectedResults);
        });
    });

    describe('avg should', () => {
        it('return the avg of values when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 60 / 13 }
            ];

            expect(RecordAggregator.avg(data, data, config)).toEqual(expectedResults);
        });

        it('return the avg of values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 60 / 13 }
            ];

            expect(RecordAggregator.avg(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('return the avg of values grouped by keys', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 4
                },
                {
                    field: 'value2',
                    numbers: 6
                },
                {
                    field: 'value3',
                    numbers: 4
                }
            ];

            expect(RecordAggregator.avg(data, data, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { source: 'numbers' };

            expect(
                RecordAggregator.avg({ numbers: null }, { numbers: null }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(
                RecordAggregator.avg({ numbers: 'hello' }, { numbers: 'hello' }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(
                RecordAggregator.avg({ numbers: 1234 }, { numbers: 1234 }, config)
            ).toEqual([{ numbers: 1234 }]);

            expect(
                RecordAggregator.avg({ numbers: { hello: 'world' } }, { numbers: { hello: 'world' } }, config)
            ).toEqual([{ numbers: 0 }]);

            expect(RecordAggregator.avg({ hello: 'world' }, { hello: 'world' }, config)).toEqual([{ numbers: 0 }]);
            expect(RecordAggregator.avg(null, null, config)).toEqual(null);

            expect(RecordAggregator.avg(['hello', null, 3], ['hello', null, 3], config)).toEqual([{ numbers: 0 }]);
        });

        it('return the avg of values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                source: 'numbers',
                keys: ['field'],
                target: 'sumOfNumbers'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    sumOfNumbers: 4
                },
                {
                    field: 'value2',
                    sumOfNumbers: 6
                },
                {
                    field: 'value3',
                    sumOfNumbers: 4
                }
            ];

            expect(RecordAggregator.avg(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 4
                },
                {
                    field: 'value2',
                    numbers: 6
                },
                {
                    field: 'value3',
                    numbers: 4
                }
            ];

            expect(RecordAggregator.avg(mixedData, mixedData, config)).toEqual(expectedResults);
        });
    });

    describe('min should', () => {
        it('return the min of values when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 1 }
            ];

            expect(RecordAggregator.min(data, data, config)).toEqual(expectedResults);
        });

        it('return the min of values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 1 }
            ];

            expect(RecordAggregator.min(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('return the min of values grouped by keys', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 1
                },
                {
                    field: 'value2',
                    numbers: 3
                },
                {
                    field: 'value3',
                    numbers: 1
                }
            ];

            expect(RecordAggregator.min(data, data, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { source: 'numbers' };

            expect(
                RecordAggregator.min({ numbers: null }, { numbers: null }, config)
            ).toEqual([{ numbers: Infinity }]);

            expect(
                RecordAggregator.min({ numbers: 'hello' }, { numbers: 'hello' }, config)
            ).toEqual([{ numbers: Infinity }]);

            expect(
                RecordAggregator.min({ numbers: 1234 }, { numbers: 1234 }, config)
            ).toEqual([{ numbers: 1234 }]);

            expect(
                RecordAggregator.min({ numbers: { hello: 'world' } }, { numbers: { hello: 'world' } }, config)
            ).toEqual([{ numbers: Infinity }]);

            expect(RecordAggregator.min({ hello: 'world' }, { hello: 'world' }, config)).toEqual([{ numbers: Infinity }]);
            expect(RecordAggregator.min(null, null, config)).toEqual(null);

            expect(RecordAggregator.min(['hello', null, 3], ['hello', null, 3], config)).toEqual([{ numbers: Infinity }]);
        });

        it('return the min of values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                source: 'numbers',
                keys: ['field'],
                target: 'sumOfNumbers'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    sumOfNumbers: 1
                },
                {
                    field: 'value2',
                    sumOfNumbers: 3
                },
                {
                    field: 'value3',
                    sumOfNumbers: 1
                }
            ];

            expect(RecordAggregator.min(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 1
                },
                {
                    field: 'value2',
                    numbers: 3
                },
                {
                    field: 'value3',
                    numbers: 1
                }
            ];

            expect(RecordAggregator.min(mixedData, mixedData, config)).toEqual(expectedResults);
        });
    });

    describe('max should', () => {
        it('return the max of values when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 9 }
            ];

            expect(RecordAggregator.max(data, data, config)).toEqual(expectedResults);
        });

        it('return the max of values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { source: 'numbers' };
            const expectedResults = [
                { numbers: 9 }
            ];

            expect(RecordAggregator.max(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('return the max of values grouped by keys', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 9
                },
                {
                    field: 'value2',
                    numbers: 9
                },
                {
                    field: 'value3',
                    numbers: 9
                }
            ];

            expect(RecordAggregator.max(data, data, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { source: 'numbers' };

            expect(
                RecordAggregator.max({ numbers: null }, { numbers: null }, config)
            ).toEqual([{ numbers: -Infinity }]);

            expect(
                RecordAggregator.max({ numbers: 'hello' }, { numbers: 'hello' }, config)
            ).toEqual([{ numbers: -Infinity }]);

            expect(
                RecordAggregator.max({ numbers: 1234 }, { numbers: 1234 }, config)
            ).toEqual([{ numbers: 1234 }]);

            expect(
                RecordAggregator.max({ numbers: { hello: 'world' } }, { numbers: { hello: 'world' } }, config)
            ).toEqual([{ numbers: -Infinity }]);

            expect(RecordAggregator.max({ hello: 'world' }, { hello: 'world' }, config)).toEqual([{ numbers: -Infinity }]);
            expect(RecordAggregator.max(null, null, config)).toEqual(null);

            expect(RecordAggregator.max(['hello', null, 3], ['hello', null, 3], config)).toEqual([{ numbers: -Infinity }]);
        });

        it('return the max of values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                source: 'numbers',
                keys: ['field'],
                target: 'sumOfNumbers'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    sumOfNumbers: 9
                },
                {
                    field: 'value2',
                    sumOfNumbers: 9
                },
                {
                    field: 'value3',
                    sumOfNumbers: 9
                }
            ];

            expect(RecordAggregator.max(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { source: 'numbers', keys: ['field'] };
            const expectedResults = [
                {
                    field: 'value1',
                    numbers: 9
                },
                {
                    field: 'value2',
                    numbers: 9
                },
                {
                    field: 'value3',
                    numbers: 9
                }
            ];

            expect(RecordAggregator.max(mixedData, mixedData, config)).toEqual(expectedResults);
        });
    });
});
