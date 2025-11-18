import { cloneDeep } from '@terascope/core-utils';
import { RecordTransform } from '../src/index.js';

describe('record transforms', () => {
    describe('renameField', () => {
        it('can rename a field', () => {
            const obj = { hello: 'world' };
            const config = { from: 'hello', to: 'goodbye' };

            expect(RecordTransform.renameField(cloneDeep(obj), cloneDeep(obj), config)).toEqual({ goodbye: 'world' });
            expect(RecordTransform.renameField(null as any, obj, config)).toEqual(null);
            expect(RecordTransform.renameField(1234 as any, obj, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.renameField(obj, obj, { from: [] as any, to: 1234 as any })
            ).toThrow();
            expect(() => RecordTransform.renameField(obj, obj, null as any)).toThrow();
            expect(() => RecordTransform.renameField(obj, obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.renameField(
                obj, obj, { from: null as any } as any
            )).toThrow();
            expect(() => RecordTransform.renameField(obj, obj, undefined as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world' };
            const otherObj = { other: 'stuff' };
            const config = { from: 'hello', to: 'goodbye' };
            const data1 = [obj, undefined, null, otherObj];
            const data2 = [23, undefined];

            expect(RecordTransform.renameField(data1, data1, config)).toEqual([{ goodbye: 'world' }, otherObj]);
            expect(RecordTransform.renameField(data2, data2, config)).toEqual([]);
        });
    });

    describe('setField', () => {
        it('can set a field', () => {
            const obj = { hello: 'world' };
            const config = { field: 'other', value: 'stuff' };
            const expectResults = Object.assign({}, obj, { other: 'stuff' });

            expect(RecordTransform.setField(cloneDeep(obj), obj, config)).toEqual(expectResults);
            expect(RecordTransform.setField(null as any, obj, config)).toEqual(null);
            expect(RecordTransform.setField(1234 as any, obj, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.setField(
                    obj, obj, { from: [] as any, to: 1234 as any } as any
                )
            ).toThrow();
            expect(() => RecordTransform.setField(obj, obj, null as any)).toThrow();
            expect(() => RecordTransform.setField(obj, obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.setField(
                obj, obj, { from: null as any } as any
            )).toThrow();
            expect(() => RecordTransform.setField(obj, obj, undefined as any)).toThrow();
            expect(() => RecordTransform.setField(obj, obj, { field: 1234 } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, obj, { field: 'someField' } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, obj, { value: 1234 } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, obj, { value: 1234 } as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world' };
            const config = { field: 'other', value: 'stuff' };
            const expectResults = Object.assign({}, obj, { other: 'stuff' });
            const data1 = [obj, undefined, null, '1234', 1234];
            const data2 = [23, undefined];

            expect(RecordTransform.setField(data1, data1, config)).toEqual([expectResults]);
            expect(RecordTransform.setField(data2, data2, config)).toEqual([]);
        });
    });

    describe('dropFields', () => {
        it('can drop fields from a record', () => {
            const obj = { hello: 'world', other: 'stuff', last: 'thing' };
            const config = { fields: ['other', 'last'] };

            expect(RecordTransform.dropFields(cloneDeep(obj), obj, config)).toEqual({ hello: 'world' });
            expect(RecordTransform.dropFields(null as any, obj, config)).toEqual(null);
            expect(RecordTransform.dropFields(1234 as any, obj, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.dropFields(
                    obj, obj, { from: [] as any, to: 1234 as any } as any
                )
            ).toThrow();
            expect(() => RecordTransform.dropFields(obj, obj, null as any)).toThrow();
            expect(() => RecordTransform.dropFields(obj, obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.dropFields(
                obj, obj, { from: null as any } as any
            )).toThrow();
            expect(() => RecordTransform.dropFields(obj, obj, undefined as any)).toThrow();
            expect(() => RecordTransform.dropFields(obj, obj, { fields: '1234' as any })).toThrow();
            expect(() => RecordTransform.dropFields(obj, obj, { fields: [1234] as any })).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world', other: 'stuff', last: 'thing' };
            const otherObj = { some: 1234 };
            const config = { fields: ['other', 'last'] };
            const data1 = [obj, undefined, null, otherObj];

            expect(RecordTransform.dropFields(data1, data1, config)).toEqual([{ hello: 'world' }, otherObj]);
            expect(RecordTransform.dropFields(
                [23, undefined], [23, undefined], config
            )).toEqual([]);
        });
    });

    describe('copyField', () => {
        it('can copy a field', () => {
            const obj = { hello: 'world', other: 'stuff' };
            const config = { from: 'other', to: 'myCopy' };

            expect(RecordTransform.copyField(cloneDeep(obj), obj, config)).toEqual({ hello: 'world', other: 'stuff', myCopy: 'stuff' });
            expect(RecordTransform.copyField(null as any, obj, config)).toEqual(null);
            expect(RecordTransform.copyField(1234 as any, obj, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.copyField(obj, obj, { from: [] as any, to: 1234 as any })
            ).toThrow();
            expect(() => RecordTransform.copyField(obj, obj, null as any)).toThrow();
            expect(() => RecordTransform.copyField(obj, obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.copyField(
                obj, obj, { from: null as any } as any
            )).toThrow();
            expect(() => RecordTransform.copyField(obj, obj, undefined as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world', other: 'stuff' };
            const otherObj = { num: 1234 };
            const config = { from: 'other', to: 'myCopy' };
            const results = { hello: 'world', other: 'stuff', myCopy: 'stuff' };

            const mixedData = [obj, undefined, null, otherObj];

            expect(RecordTransform.copyField(
                mixedData, mixedData, config
            )).toEqual([results, otherObj]);
            expect(RecordTransform.copyField([23, undefined], [23, undefined], config)).toEqual([]);
        });
    });

    describe('transformRecord', () => {
        it('can run a jexl expression', () => {
            const obj = { hello: 'world', other: 'stuff' };
            const config = { jexlExp: '[hello]', field: 'final' };
            const clone = cloneDeep(obj);
            const results = Object.assign({}, clone, { final: ['world'] });

            expect(RecordTransform.transformRecord(clone, clone, config)).toEqual(results);
            expect(RecordTransform.transformRecord(null as any, obj, config)).toEqual(null);
            expect(RecordTransform.transformRecord(1234 as any, obj, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.transformRecord(
                    obj, obj, { from: [] as any, to: 1234 as any } as any
                )
            ).toThrow();
            expect(() => RecordTransform.transformRecord(obj, obj, null as any)).toThrow();
            expect(() => RecordTransform.transformRecord(obj, obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.transformRecord(
                obj, obj, { query: null as any } as any
            )).toThrow();
            expect(() => RecordTransform.transformRecord(obj, obj, undefined as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { num: 1234 };
            const config = { jexlExp: 'num * 2', field: 'calc' };

            const mixedData = [obj, undefined, null];

            expect(RecordTransform.transformRecord(
                mixedData, mixedData, config
            )).toEqual([{ num: 1234, calc: 1234 * 2 }]);
        });

        it('can call data-mate functions in expression', () => {
            const obj = { foo: 'bar' };
            const config = { jexlExp: 'foo|extract({ jexlExp: "foo|toUpperCase" })', field: 'final' };

            const mixedData = [obj, undefined, null];

            expect(RecordTransform.transformRecord(
                mixedData, mixedData, config
            )).toEqual([{ foo: 'bar', final: 'BAR' }]);
        });
    });

    describe('dedupe', () => {
        it('should dedupe array values', () => {
            expect(
                RecordTransform.dedupe([1, 2, 2, 3, 3, 3, undefined, 4])
            ).toEqual([1, 2, 3, 4]);

            expect(RecordTransform.dedupe(null as any)).toBe(null);
            expect(RecordTransform.dedupe(undefined as any)).toBe(null);
        });

        it('should dedupe array object values', () => {
            expect(
                RecordTransform.dedupe([
                    { hello: 'world' },
                    { hello: 'world' },
                    { other: 'obj' },
                ])
            ).toEqual([{ hello: 'world' }, { other: 'obj' }]);

            expect(RecordTransform.dedupe(null as any)).toBe(null);
            expect(RecordTransform.dedupe(undefined as any)).toBe(null);
        });
    });
});
