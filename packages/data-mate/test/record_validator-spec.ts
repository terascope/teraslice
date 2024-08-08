import { RecordValidator } from '../src/index.js';

describe('record validators', () => {
    describe('required', () => {
        it('should filter records that do not have the fields', () => {
            const obj1 = { foo: true, bar: true };
            const obj2 = { foo: true };
            const fields = ['bar'];

            expect(RecordValidator.required(obj1, obj1, { fields })).toEqual(obj1);
            expect(RecordValidator.required(obj2, obj2, { fields })).toEqual(null);
            expect(RecordValidator.required(
                undefined as any, undefined as any, { fields }
            )).toEqual(null);
            expect(RecordValidator.required('1234' as any, {}, { fields })).toEqual(null);
            expect(RecordValidator.required(null as any, {}, { fields })).toEqual(null);
        });

        it('will throw if fields are not provided or is empty', () => {
            const obj = { foo: true, bar: true };
            // @ts-expect-error defaults can act differently is something actualy put there
            expect(() => RecordValidator.required(obj)).toThrow();
            expect(() => RecordValidator.required(obj, obj, { } as any)).toThrow();
            expect(() => RecordValidator.required(obj, obj, { fields: [] })).toThrow();
            expect(() => RecordValidator.required(obj, obj, { fields: 'hello' as any })).toThrow();
            expect(() => RecordValidator.required(obj, obj, { fields: 'hello' as any })).toThrow();
            expect(() => RecordValidator.required(
                obj, obj, { fields: [23, 324] as any }
            )).toThrow();
            expect(() => RecordValidator.required(
                obj, obj, undefined as any
            )).toThrow();
            expect(() => RecordValidator.required(obj, obj, null as any)).toThrow();
        });

        it('validates an array of values, ignores undefined/null', () => {
            const fields = ['bar'];
            const obj = { foo: true, bar: true };

            expect(RecordValidator.required(
                [obj, undefined], [obj, undefined], { fields }
            )).toEqual([obj]);
            expect(RecordValidator.required(
                [23, undefined], [23, undefined], { fields }
            )).toEqual([]);
        });
    });

    describe('select', () => {
        it('can return objects that match', () => {
            const obj1 = { foo: true, bar: true };
            const obj2 = { foo: true };
            const args = { query: '_exists_:bar' };

            expect(RecordValidator.select(obj1, obj1, args)).toEqual(obj1);
            expect(RecordValidator.select(obj2, obj2, args)).toEqual(null);
            expect(RecordValidator.select(null as any, obj2, args)).toEqual(null);
            expect(RecordValidator.select(1234 as any, obj2, args)).toEqual(null);
            expect(RecordValidator.select('jalsdfopiuasdf' as any, obj2, args)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };
            expect(() => RecordValidator.select(obj, obj, { query: [] as any })).toThrow();
            expect(() => RecordValidator.select(obj, obj, { query: 1234 as any })).toThrow();
            expect(() => RecordValidator.select(obj, obj, { query: null as any })).toThrow();
            expect(() => RecordValidator.select(obj, obj, { query: 'foo:true', type_config: 1234 as any })).toThrow();
            expect(() => RecordValidator.select(obj, obj, { query: 'foo:true', variables: 'hello' as any })).toThrow();
            expect(() => RecordValidator.select(obj, obj, undefined as any)).toThrow();
            expect(() => RecordValidator.select(obj, obj, null as any)).toThrow();
        });

        it('validates an array of values, ignores undefined/null', () => {
            const obj = { foo: true, bar: true };
            const args = { query: '_exists_:bar' };

            expect(RecordValidator.select(
                [obj, undefined, null], [obj, undefined, null], args
            )).toEqual([obj]);
            expect(RecordValidator.select([23, undefined], [23, undefined], args)).toEqual([]);
        });
    });

    describe('reject', () => {
        it('can return objects that do not match', () => {
            const obj1 = { foo: true, bar: true };
            const obj2 = { foo: true };
            const args = { query: '_exists_:bar' };

            expect(RecordValidator.reject(obj1, obj1, args)).toEqual(null);
            expect(RecordValidator.reject(obj2, obj2, args)).toEqual(obj2);
            expect(RecordValidator.reject(null as any, obj2, args)).toEqual(null);
            expect(RecordValidator.reject(1234 as any, obj2, args)).toEqual(null);
            expect(RecordValidator.reject('jalsdfopiuasdf' as any, obj2, args)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };
            expect(() => RecordValidator.reject(obj, obj, { query: [] as any })).toThrow();
            expect(() => RecordValidator.reject(obj, obj, { query: 1234 as any })).toThrow();
            expect(() => RecordValidator.reject(obj, obj, { query: null as any })).toThrow();
            expect(() => RecordValidator.reject(obj, obj, { query: 'foo:true', type_config: 1234 as any })).toThrow();
            expect(() => RecordValidator.reject(obj, obj, { query: 'foo:true', variables: 'hello' as any })).toThrow();
            expect(() => RecordValidator.reject(obj, obj, undefined as any)).toThrow();
            expect(() => RecordValidator.reject(obj, obj, null as any)).toThrow();
        });

        it('validates an array of values, ignores undefined/null', () => {
            const obj = { foo: true, bar: true };
            const obj2 = { foo: true };

            const args = { query: '_exists_:bar' };

            expect(RecordValidator.reject(
                [obj, undefined, null, obj2], [obj, undefined, null, obj2], args
            )).toEqual([obj2]);
            expect(RecordValidator.reject([23, undefined], [23, undefined], args)).toEqual([]);
        });
    });
});
