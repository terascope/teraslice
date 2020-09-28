import 'jest-extended';
import {
    getFirstKey,
    getFirstValue,
    withoutNil,
    filterObject,
    isObjectEntity,
    isSame
} from '../src/objects';
import { DataEntity } from '../src';

describe('Objects', () => {
    describe('withoutNil', () => {
        let input: any;
        let output: any;

        beforeEach(() => {
            input = {
                a: 1,
                b: null,
                c: 0,
                d: undefined,
                e: {
                    example: true,
                    other: null,
                }
            };

            output = withoutNil(input);
        });

        it('should copy the top level object', () => {
            expect(output).not.toBe(input);
        });

        it('should not copy a nested object', () => {
            expect(output.e).toBe(input.e);
        });

        it('should remove the nil values from the object', () => {
            expect(output).toHaveProperty('a', 1);
            expect(output).not.toHaveProperty('b');
            expect(output).toHaveProperty('c', 0);
            expect(output).not.toHaveProperty('d');
            expect(output).toHaveProperty('e', {
                example: true,
                other: null,
            });
        });
    });

    describe('getFirstValue', () => {
        describe('when given an object', () => {
            it('should return the first value', () => {
                const obj = { key1: 1, key2: 2 };
                expect(getFirstValue(obj)).toEqual(1);
            });
        });

        describe('when given an empty object', () => {
            it('should return nil', () => {
                expect(getFirstValue({})).toBeNil();
            });
        });
    });

    describe('getFirstKey', () => {
        describe('when given an object', () => {
            it('should return the first value', () => {
                const obj = { key1: 1, key2: 2 };
                expect(getFirstKey(obj)).toEqual('key1');
            });
        });

        describe('when given an empty object', () => {
            it('should return nil', () => {
                expect(getFirstKey({})).toBeNil();
            });
        });
    });

    describe('isSame', () => {
        describe('when given an object', () => {
            it('should return true if they are the same', () => {
                const obj = { key1: 1, key2: 2 };
                const obj2 = { key1: 1, key2: 2 };

                expect(isSame(obj, obj2)).toBeTrue();
            });

            it('should return true if they are the same even with out of order keys', () => {
                const obj = { key1: 1, key2: 2 };
                const obj2 = { key2: 2, key1: 1 };

                expect(isSame(obj, obj2)).toBeTrue();
            });

            it('should return true if they have same key/values even if other is DataEntity', () => {
                const obj = { key1: 1, key2: 2 };

                expect(isSame(obj, new DataEntity(obj))).toBeTrue();
            });

            it('should return true false when compared to anything else', () => {
                const obj = { key1: 1, key2: 2 };

                expect(isSame(obj, 'true')).toBeFalse();
                expect(isSame(obj, null)).toBeFalse();
                expect(isSame(obj, [1, 2])).toBeFalse();
                expect(isSame(obj, [obj])).toBeFalse();
            });
        });

        describe('when other values other than arrays and objects', () => {
            it('should true if they are the same', () => {
                expect(isSame(null, null)).toBeTrue();
                expect(isSame(undefined, undefined)).toBeTrue();
                expect(isSame(NaN, NaN)).toBeTrue();

                expect(isSame('true', 'true')).toBeTrue();
                expect(isSame('true', true)).toBeFalse();

                expect(isSame(3, 3)).toBeTrue();
                expect(isSame(3, 324)).toBeFalse();

                expect(isSame(false, null)).toBeFalse();
                expect(isSame(false, undefined)).toBeFalse();
                expect(isSame(undefined, null)).toBeFalse();
            });
        });

        describe('when given an array', () => {
            it('should true if they are the same, order matters', () => {
                expect(isSame([1, 2, 3], [1, 2, 3])).toBeTrue();
                expect(isSame([1, 2, 3], [1, 2, undefined, 3])).toBeFalse();
                expect(isSame([1, 2, 3], [1, 3, 2])).toBeFalse();

                expect(isSame(['hello'], ['hello'])).toBeTrue();

                expect(isSame(['hello', 3], ['hello', 3])).toBeTrue();

                expect(isSame(['hello'], ['hello'])).toBeTrue();
                expect(isSame([{ some: 'obj' }], [{ some: 'obj' }])).toBeTrue();
            });
        });
    });

    describe('filterObject', () => {
        it('should be able to filter out the keys using excludes', () => {
            expect(filterObject({
                a: 1,
                b: 2,
            }, {
                excludes: ['b']
            })).toEqual({
                a: 1,
            });
        });

        it('should be able to filter out the keys using includes', () => {
            expect(filterObject({
                a: 1,
                b: 2,
            }, {
                includes: ['b']
            })).toEqual({
                b: 2,
            });
        });

        it('should be able to filter out the keys using includes and excludes', () => {
            expect(filterObject({
                b: 2,
                c: 3,
                a: 1,
            }, {
                includes: ['a', 'b', 'c'],
                excludes: ['b']
            })).toEqual({
                a: 1,
                c: 3,
            });
        });

        it('should return the whole object if not given a filter', () => {
            expect(filterObject({
                c: 3,
                a: 1,
                b: 2,
            })).toEqual({
                c: 3,
                a: 1,
                b: 2,
            });
        });
    });

    describe('isObjectEntity', () => {
        describe('when given an object', () => {
            it('should return true', () => {
                const obj = { key1: 1, key2: 2 };
                expect(isObjectEntity(obj)).toBeTrue();
            });
        });

        describe('when given a DataEntity', () => {
            it('should return true', () => {
                const data = new DataEntity({});
                expect(isObjectEntity(data)).toBeTrue();
            });
        });

        describe('when given anything else', () => {
            it('should return false', () => {
                expect(isObjectEntity(1234)).toBeFalse();
                expect(isObjectEntity('1234')).toBeFalse();
                expect(isObjectEntity([])).toBeFalse();
                expect(isObjectEntity([{ hello: 'world' }])).toBeFalse();
                expect(isObjectEntity(null)).toBeFalse();
                expect(isObjectEntity(new Set())).toBeFalse();
                expect(isObjectEntity(new Map())).toBeFalse();
            });
        });
    });
});
