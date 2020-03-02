import 'jest-extended';
import { DataEntity } from '../src/entities';
import {
    getTypeOf,
    isPlainObject,
} from '../src/core';

describe('Core Utils', () => {
    class TestObj {
        hi = true
        has() {}
    }

    describe('isPlainObject', () => {
        it('should correctly detect the an object type', () => {
            // @ts-ignore
            expect(isPlainObject()).toBeFalse();
            expect(isPlainObject(null)).toBeFalse();
            expect(isPlainObject(true)).toBeFalse();
            expect(isPlainObject([])).toBeFalse();
            expect(isPlainObject([{ hello: true }])).toBeFalse();
            expect(isPlainObject('some-string')).toBeFalse();
            expect(isPlainObject(Buffer.from('some-string'))).toBeFalse();
            expect(isPlainObject(new TestObj())).toBeFalse();
            expect(isPlainObject(new DataEntity({}))).toBeFalse();
            expect(isPlainObject(Promise.resolve())).toBeFalse();
            expect(isPlainObject(Object.create({}))).toBeTrue();
            expect(isPlainObject(Object.create({ hello: true }))).toBeTrue();
            expect(isPlainObject({})).toBeTrue();
            expect(isPlainObject({ hello: true })).toBeTrue();
        });
    });

    describe('getTypeOf', () => {
        it('should return the correct kind', () => {
            expect(getTypeOf({})).toEqual('Object');

            expect(getTypeOf(new DataEntity({}))).toEqual('DataEntity');
            expect(getTypeOf(DataEntity.make({}))).toEqual('DataEntity');

            expect(getTypeOf([])).toEqual('Array');

            const fn = () => 123;

            function hello() {
                return 'hello';
            }

            expect(getTypeOf(fn)).toEqual('Function');
            expect(getTypeOf(hello)).toEqual('Function');

            expect(getTypeOf(Buffer.from('hello'))).toEqual('Buffer');
            expect(getTypeOf('hello')).toEqual('String');

            expect(getTypeOf(123)).toEqual('Number');

            expect(getTypeOf(null)).toEqual('null');
            expect(getTypeOf(undefined)).toEqual('undefined');

            const error = new Error('Hello');
            expect(getTypeOf(error)).toEqual('Error');
        });
    });
});
