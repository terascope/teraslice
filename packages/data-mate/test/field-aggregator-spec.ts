import { FieldAggregator } from '../src/index.js';

describe('FieldAggregator', () => {
    describe('uniqueField should', () => {
        it('return deduped values', () => {
            expect(FieldAggregator.uniqueField([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
            expect(FieldAggregator.uniqueField(['1', '2', '2', '3', '3', '3'])).toEqual(['1', '2', '3']);
        });

        it('return null if input is null/undefined', () => {
            expect(FieldAggregator.uniqueField(null)).toEqual(null);
            expect(FieldAggregator.uniqueField(undefined)).toEqual(null);
        });

        it('return the value passed in if an array is not passed', () => {
            expect(FieldAggregator.uniqueField('hello')).toEqual('hello');
            expect(FieldAggregator.uniqueField(1234)).toEqual(1234);
            expect(FieldAggregator.uniqueField({ hello: 'world' })).toEqual({ hello: 'world' });
        });
    });

    describe('countField should', () => {
        it('return how many values are in an array', () => {
            expect(FieldAggregator.countField([1, 2, 3])).toEqual(3);
            expect(FieldAggregator.countField(['1', '2', '2', '3', '3', '3'])).toEqual(6);
        });

        it('return 0 if input is null/undefined', () => {
            expect(FieldAggregator.countField(null)).toEqual(0);
            expect(FieldAggregator.countField(undefined)).toEqual(0);
        });

        it('return 1 if an array is not passed', () => {
            expect(FieldAggregator.countField('hello')).toEqual(1);
            expect(FieldAggregator.countField(1234)).toEqual(1);
            expect(FieldAggregator.countField({ hello: 'world' })).toEqual(1);
        });
    });

    describe('sumField should', () => {
        it('will return the sum of all numbers', () => {
            expect(FieldAggregator.sumField([1, 2, 3])).toEqual(6);
            expect(FieldAggregator.sumField(['1', '2', '2', '3', '3', '3'])).toEqual(0);
            expect(FieldAggregator.sumField([1, 'hello', 2, 3, '4', null])).toEqual(6);
        });

        it('return null if input is null/undefined', () => {
            expect(FieldAggregator.sumField(null)).toEqual(null);
            expect(FieldAggregator.sumField(undefined)).toEqual(null);
        });

        it('only returns a number if an array is not passed', () => {
            expect(FieldAggregator.sumField('hello')).toEqual(null);
            expect(FieldAggregator.sumField(1234)).toEqual(1234);
            expect(FieldAggregator.sumField({ hello: 'world' })).toEqual(null);
        });
    });

    describe('avgField should', () => {
        it('will return the average of all numbers', () => {
            expect(FieldAggregator.avgField([1, 2, 3])).toEqual(2);
        });

        it('ignore non number items in an array', () => {
            expect(FieldAggregator.avgField(['1', '1', '2', '3', '3'])).toEqual(0);
            expect(FieldAggregator.avgField([1, null, 2, { other: 'stuff' }, 3])).toEqual(2);
        });

        it('return null if input is null/undefined', () => {
            expect(FieldAggregator.avgField(null)).toEqual(null);
            expect(FieldAggregator.avgField(undefined)).toEqual(null);
        });

        it('only return a number if an array is not passed', () => {
            expect(FieldAggregator.avgField('hello')).toEqual(null);
            expect(FieldAggregator.avgField(1234)).toEqual(1234);
            expect(FieldAggregator.avgField({ hello: 'world' })).toEqual(null);
        });
    });

    describe('minField should', () => {
        it('will return the min of all numbers', () => {
            expect(FieldAggregator.minField([1, 2, 3])).toEqual(1);
        });

        it('ignore non number items in an array', () => {
            expect(FieldAggregator.minField(['1', '1', '2', '3', '3'])).toEqual(Infinity);
            expect(FieldAggregator.minField([1, null, 2, { other: 'stuff' }, 3])).toEqual(1);
        });

        it('return null if input is null/undefined', () => {
            expect(FieldAggregator.minField(null)).toEqual(null);
            expect(FieldAggregator.minField(undefined)).toEqual(null);
        });

        it('only return a number if an array is not passed', () => {
            expect(FieldAggregator.minField('hello')).toEqual(null);
            expect(FieldAggregator.minField(1234)).toEqual(1234);
            expect(FieldAggregator.minField({ hello: 'world' })).toEqual(null);
        });
    });

    describe('maxField should', () => {
        it('will return the min of all numbers', () => {
            expect(FieldAggregator.maxField([1, 2, 3])).toEqual(3);
        });

        it('ignore non number items in an array', () => {
            expect(FieldAggregator.maxField(['1', '1', '2', '3', '3'])).toEqual(-Infinity);
            expect(FieldAggregator.maxField([1, null, 2, { other: 'stuff' }, 3])).toEqual(3);
        });

        it('return null if input is null/undefined', () => {
            expect(FieldAggregator.maxField(null)).toEqual(null);
            expect(FieldAggregator.maxField(undefined)).toEqual(null);
        });

        it('only return a number if an array is not passed', () => {
            expect(FieldAggregator.maxField('hello')).toEqual(null);
            expect(FieldAggregator.maxField(1234)).toEqual(1234);
            expect(FieldAggregator.maxField({ hello: 'world' })).toEqual(null);
        });
    });
});
