import 'jest-extended';
import { __IS_DATAENTITY_KEY } from '@terascope/types';
import {
    isGreaterThan, isGreaterThanFP, isLessThanOrEqualToFP,
    isLessThan, isLessThanFP, isGreaterThanOrEqualTo,
    isGreaterThanOrEqualToFP, isLessThanOrEqualTo, isDeepEqual
} from '../src/equality.js';

describe('Equality', () => {
    describe('isDeepEqual', () => {
        describe('when given an object', () => {
            it('should return true if they are the same', () => {
                const obj = { key1: 1, key2: 2 };
                const obj2 = { key1: 1, key2: 2 };

                expect(isDeepEqual(obj, obj2)).toBeTrue();
            });

            it('should return true if they are the same even with out of order keys', () => {
                const obj = { key1: 1, key2: 2 };
                const obj2 = { key2: 2, key1: 1 };

                expect(isDeepEqual(obj, obj2)).toBeTrue();
            });

            it('should return true if they have same key/values even if other is DataEntity', () => {
                const obj = { key1: 1, key2: 2 };
                // This is a mock
                const fakeDataEntity = {
                    ...obj,
                    __IS_DATAENTITY_KEY: true
                };
                expect(isDeepEqual(obj, fakeDataEntity)).toBeTrue();
            });

            it('should return true false when compared to anything else', () => {
                const obj = { key1: 1, key2: 2 };

                expect(isDeepEqual(obj, 'true')).toBeFalse();
                expect(isDeepEqual(obj, null)).toBeFalse();
                expect(isDeepEqual(obj, [1, 2])).toBeFalse();
                expect(isDeepEqual(obj, [obj])).toBeFalse();
            });
        });

        describe('when other values other than arrays and objects', () => {
            it('should true if they are the same', () => {
                expect(isDeepEqual(null, null)).toBeTrue();
                expect(isDeepEqual(undefined, undefined)).toBeTrue();
                expect(isDeepEqual(NaN, NaN)).toBeTrue();

                expect(isDeepEqual('true', 'true')).toBeTrue();
                expect(isDeepEqual('true', true)).toBeFalse();

                expect(isDeepEqual(3, 3)).toBeTrue();
                expect(isDeepEqual(3, 324)).toBeFalse();

                expect(isDeepEqual(false, null)).toBeFalse();
                expect(isDeepEqual(false, undefined)).toBeFalse();
                expect(isDeepEqual(undefined, null)).toBeFalse();
            });
        });

        describe('when given an array', () => {
            it('should true if they are the same, order matters', () => {
                expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBeTrue();
                expect(isDeepEqual([1, 2, 3], [1, 2, undefined, 3])).toBeFalse();
                expect(isDeepEqual([1, 2, 3], [1, 3, 2])).toBeFalse();

                expect(isDeepEqual(['hello'], ['hello'])).toBeTrue();

                expect(isDeepEqual(['hello', 3], ['hello', 3])).toBeTrue();

                expect(isDeepEqual(['hello'], ['hello'])).toBeTrue();
                expect(isDeepEqual([{ some: 'obj' }], [{ some: 'obj' }])).toBeTrue();
            });
        });
    });

    describe('isGreaterThanOrEqualTo', () => {
        test.each([
            [2, 1],
            [2, 2],
            [2, '2'],
            ['c', 'b'],
            [BigInt(10), 9],
            [10, BigInt(9)],
            [-100, -120],
        ])('should consider %p greater than or equal to %p', (value, other) => {
            expect(isGreaterThanOrEqualTo(value, other)).toBeTrue();
            expect(isGreaterThanOrEqualToFP(other)(value)).toBeTrue();
        });

        test.each([
            [1, 2],
            ['1', 2],
            ['a', 'b'],
            [{ foo: true }, { foo: true }],
            [{ foo: true }, undefined],
            [undefined, { foo: true }],
            [null, -1],
        ])('should NOT consider %p greater than or equal to %p', (value, other) => {
            expect(isGreaterThanOrEqualTo(value, other)).toBeFalse();
            expect(isGreaterThanOrEqualToFP(other)(value)).toBeFalse();
        });
    });

    describe('isGreaterThan', () => {
        test.each([
            [2, 1],
            ['c', 'b'],
            [BigInt(10), 9],
            [10, BigInt(9)],
            [-100, -120],
        ])('should consider %p greater than %p', (value, other) => {
            expect(isGreaterThan(value, other)).toBeTrue();
            expect(isGreaterThanFP(other)(value)).toBeTrue();
        });

        test.each([
            [1, 2],
            [2, 2],
            [2, '2'],
            ['1', 2],
            ['a', 'b'],
            [{ foo: true }, { foo: true }],
            [{ foo: true }, undefined],
            [undefined, { foo: true }],
            [null, -1],
        ])('should NOT consider %p greater than %p', (value, other) => {
            expect(isGreaterThan(value, other)).toBeFalse();
            expect(isGreaterThanFP(other)(value)).toBeFalse();
        });
    });

    describe('isLessThanOrEqualTo', () => {
        test.each([
            [1, 2],
            [2, 2],
            [2, '2'],
            ['b', 'c'],
            [BigInt(9), 10],
            [9, BigInt(10)],
            [-120, -100],
        ])('should consider %p less than or equal to %p', (value, other) => {
            expect(isLessThanOrEqualTo(value, other)).toBeTrue();
            expect(isLessThanOrEqualToFP(other)(value)).toBeTrue();
        });

        test.each([
            [2, 1],
            ['2', 1],
            ['b', 'a'],
            [{ foo: true }, { foo: true }],
            [{ foo: true }, undefined],
            [undefined, { foo: true }],
            [null, -1],
        ])('should NOT consider %p less than or equal to %p', (value, other) => {
            expect(isLessThanOrEqualTo(value, other)).toBeFalse();
            expect(isLessThanOrEqualToFP(other)(value)).toBeFalse();
        });
    });

    describe('isLessThan', () => {
        test.each([
            [1, 2],
            ['b', 'c'],
            [BigInt(9), 10],
            [9, BigInt(10)],
            [-120, -100],
        ])('should consider %p less than %p', (value, other) => {
            expect(isLessThan(value, other)).toBeTrue();
            expect(isLessThanFP(other)(value)).toBeTrue();
        });

        test.each([
            [2, 1],
            [2, 2],
            [2, '2'],
            ['2', 1],
            ['b', 'a'],
            [{ foo: true }, { foo: true }],
            [{ foo: true }, undefined],
            [undefined, { foo: true }],
            [null, -1],
        ])('should NOT consider %p less than %p', (value, other) => {
            expect(isLessThan(value, other)).toBeFalse();
            expect(isLessThanFP(other)(value)).toBeFalse();
        });
    });
});
