import 'jest-extended';
import {
    DataEntity,
    isPlainObject,
    has
} from '../src';

describe('Objects', () => {
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

    describe('has', () => {
        const symbol = Symbol('__hello__');

        it('should an object correctly', () => {
            expect(has({ hi: true }, 'hi')).toBeTrue();
            expect(has({ hi: false }, 'hi')).toBeTrue();
            expect(has({ '': 'hi' }, '')).toBeTrue();
            expect(has({ 1: 'hi' }, 1)).toBeTrue();
            expect(has({ 0: 'hi' }, 0)).toBeTrue();
            expect(has({ 3: 'hi' }, 2)).toBeFalse();
            expect(has(new TestObj(), 'hi')).toBeTrue();

            expect(has({}, 'hi')).toBeFalse();
            expect(has({ a: 'b' }, Buffer.from('a') as any)).toBeTrue();
            expect(has({
                [symbol]: true
            }, symbol)).toBeTrue();
        });

        it('should handle a Map correct', () => {
            const map = new Map();
            map.set('hi', 'hello');
            expect(has(map, 'hi')).toBeTrue();
            expect(has(map, 'hello')).toBeFalse();
            expect(has(map, 0)).toBeFalse();
            expect(has(map, null as any)).toBeFalse();
            expect(has(map, undefined as any)).toBeFalse();
            expect(has(map, [] as any)).toBeFalse();
            expect(has(map, {} as any)).toBeFalse();
        });

        it('should an array correctly', () => {
            expect(has(['hi', 'hello'], 0)).toBeTrue();
            expect(has(['hi', 'hello'], 'hi')).toBeFalse();
            expect(has(['hi', 'hello'], 1)).toBeTrue();
            expect(has(['hi', 'hello'], 'hello')).toBeFalse();
            expect(has(['hi', 'hello'], 2)).toBeFalse();
        });

        it('should handle a Set correct', () => {
            const set = new Set();
            set.add('hi');
            expect(has(set, 'hi')).toBeTrue();
            expect(has(set, 'hello')).toBeFalse();
            expect(has(set, 0)).toBeFalse();
            expect(has(set, null as any)).toBeFalse();
            expect(has(set, undefined as any)).toBeFalse();
            expect(has(set, [] as any)).toBeFalse();
            expect(has(set, {} as any)).toBeFalse();
        });

        it('should handle non-objects safely', () => {
            expect(has(['hi'], 'hi') as any).toBeFalse();
            expect(has(Buffer.from('hi'), 'hi') as any).toBeFalse();
            expect(has('hi' as any, 'hi')).toBeFalse();
            expect(has(null as any, 'hi')).toBeFalse();
            expect(has(undefined as any, 'hi')).toBeFalse();
            expect(has(0 as any, 'hi')).toBeFalse();
            expect(has(1 as any, 'hi')).toBeFalse();
            expect(has(NaN as any, 'hi')).toBeFalse();
            expect(has((() => {}) as any, 'hi')).toBeFalse();
        });

        it('should handle an non-(string/number/symbol) keys safely', () => {
            expect(has({ a: 'b' }, null as any)).toBeFalse();
            expect(has({ a: 'b' }, undefined as any)).toBeFalse();
            expect(has({ }, null as any)).toBeFalse();
            expect(has({ }, undefined as any)).toBeFalse();
            expect(has({ a: 'b' }, {} as any)).toBeFalse();
            expect(has({ a: 'b' }, [] as any)).toBeFalse();
            expect(has({ a: 'b' }, NaN)).toBeFalse();
            expect(has({ a: 'b' }, (() => {}) as any)).toBeFalse();
        });
    });
});
