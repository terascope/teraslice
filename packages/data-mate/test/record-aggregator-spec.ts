import { RecordAggregator, BatchConfig } from '../src';

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
            const config: BatchConfig = { sourceField: 'numbers' };
            const expectedResults = [
                { numbers: [1, 3, 4, 5, 6, 9, 2] }
            ];

            expect(RecordAggregator.unique(data, data, config)).toEqual(expectedResults);
        });

        it('return unique values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { sourceField: 'numbers' };
            const expectedResults = [
                { numbers: [1, 3, 'hello', 4, 5, 6, 9, 2, { hello: 'world' }, 'other'] }
            ];

            expect(RecordAggregator.unique(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('returns the correct value if no array is provided', () => {
            const config: BatchConfig = { sourceField: 'numbers' };

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
        });

        it('return unique values grouped by keys', () => {
            const config: BatchConfig = { sourceField: 'numbers', keys: ['field'] };
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
                sourceField: 'numbers',
                keys: ['field'],
                targetField: 'uniqNumbers'
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
            const config: BatchConfig = { sourceField: 'numbers', keys: ['field'] };
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
            const config: BatchConfig = { sourceField: 'numbers' };
            const expectedResults = [
                { numbers: 13 }
            ];

            expect(RecordAggregator.count(data, data, config)).toEqual(expectedResults);
        });

        it('return unique values with mixed data when no keys are provided', () => {
            const config: BatchConfig = { sourceField: 'numbers' };
            const expectedResults = [
                { numbers: 17 }
            ];

            expect(RecordAggregator.count(mixedData, mixedData, config)).toEqual(expectedResults);
        });

        it('return unique values grouped by keys', () => {
            const config: BatchConfig = { sourceField: 'numbers', keys: ['field'] };
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
            const config: BatchConfig = { sourceField: 'numbers' };

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
        });

        it('return unique values grouped by keys but change source key name', () => {
            const config: BatchConfig = {
                sourceField: 'numbers',
                keys: ['field'],
                targetField: 'uniqNumbers'
            };
            const expectedResults = [
                {
                    field: 'value1',
                    uniqNumbers: 6
                },
                {
                    field: 'value2',
                    uniqNumbers: 4
                },
                {
                    field: 'value3',
                    uniqNumbers: 3
                }
            ];

            expect(RecordAggregator.count(data, data, config)).toEqual(expectedResults);
        });

        it('return correct values with mixed data', () => {
            const config: BatchConfig = { sourceField: 'numbers', keys: ['field'] };
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
    });
});
