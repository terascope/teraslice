import { RecordAggregator, BatchConfig } from '../src';

describe('RecordAggregator', () => {
    let data: any;

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
    });

    describe('unique should', () => {
        it('return unique values when no keys are provided', () => {
            const config: BatchConfig = { sourceField: 'numbers' };
            const expectedResults = [
                { numbers: [1, 3, 4, 5, 6, 9, 2] }
            ];

            expect(RecordAggregator.unique(data, data, config)).toEqual(expectedResults);
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
    });
});
