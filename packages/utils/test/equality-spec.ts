import 'jest-extended';
import {
    isDeepEqual
} from '../src/equality';
import { DataEntity } from '../src';

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

                expect(isDeepEqual(obj, new DataEntity(obj))).toBeTrue();
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
});
