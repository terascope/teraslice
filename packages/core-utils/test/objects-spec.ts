import 'jest-extended';
import {
    getFirstKey, getFirstValue, withoutNil,
    filterObject, isObjectEntity, lookup
} from '../src/objects.js';
import { DataEntity } from '../src/index.js';

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

    describe('lookup', () => {
        test.each([
            ['key', { key: 'value', key2: 'value2' }, 'value'],
            [456, { 123: 'value', 456: 'value2' }, 'value2'],
            ['key', { key1: 'value', key2: 'value2' }, undefined],
            ['foo', 'foo:bar', 'bar'],
            [123, '123:bar', 'bar'],
            [789, '123:bar\n456:baz\n789:max', 'max'],
            [2, '123:bar\n456:baz\n789:max', undefined],
            [2, 'this is not a properly formated string', undefined],
            [1, ['deep', 'bob', 'ray', 'value'], 'bob'],
            [7, ['deep', 'bob', 'ray', 'value'], undefined],
            ['not a number', ['deep', 'bob', 'ray', 'value'], undefined]
        ])('should return key from a value', (key: any, obj: any, value: any) => {
            expect(lookup(obj)(key)).toEqual(value);
        });

        it('should throw an error if input is not an object, string or array', () => {
            expect(() => {
                lookup(123456)('key');
            }).toThrow('input must be an Object Entity, String, received Number');
        });

        it('should throw an error if key is not a number or string', () => {
            expect(() => {
                lookup(['deep', 'bob', 'ray', 'value'])(['foo']);
            }).toThrow('lookup key must be not be an object, received Array');
        });
    });
});
