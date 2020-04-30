import { FieldAggregator } from '../src';

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
});
