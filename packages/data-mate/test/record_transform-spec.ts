import { cloneDeep } from '@terascope/utils';
import { RecordTransform } from '../src';

describe('record transforms', () => {
    describe('renameField', () => {
        it('can rename a field', () => {
            const obj = { hello: 'world' };
            const config = { from: 'hello', to: 'goodbye' };

            expect(RecordTransform.renameField(cloneDeep(obj), config)).toEqual({ goodbye: 'world' });
            expect(RecordTransform.renameField(null as any, config)).toEqual(null);
            expect(RecordTransform.renameField(1234 as any, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.renameField(obj, { from: [] as any, to: 1234 as any })
            ).toThrow();
            expect(() => RecordTransform.renameField(obj, null as any)).toThrow();
            expect(() => RecordTransform.renameField(obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.renameField(obj, { from: null as any } as any)).toThrow();
            expect(() => RecordTransform.renameField(obj, undefined as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world' };
            const otherObj = { other: 'stuff' };
            const config = { from: 'hello', to: 'goodbye' };

            expect(RecordTransform.renameField([obj, undefined, null, otherObj], config)).toEqual([{ goodbye: 'world' }, otherObj]);
            expect(RecordTransform.renameField([23, undefined], config)).toEqual([]);
        });
    });

    describe('setField', () => {
        it('can set a field', () => {
            const obj = { hello: 'world' };
            const config = { field: 'other', value: 'stuff' };
            const expectResults = Object.assign({}, obj, { other: 'stuff' });

            expect(RecordTransform.setField(cloneDeep(obj), config)).toEqual(expectResults);
            expect(RecordTransform.setField(null as any, config)).toEqual(null);
            expect(RecordTransform.setField(1234 as any, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.setField(obj, { from: [] as any, to: 1234 as any } as any)
            ).toThrow();
            expect(() => RecordTransform.setField(obj, null as any)).toThrow();
            expect(() => RecordTransform.setField(obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.setField(obj, { from: null as any } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, undefined as any)).toThrow();
            expect(() => RecordTransform.setField(obj, { field: 1234 } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, { field: 'someField' } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, { value: 1234 } as any)).toThrow();
            expect(() => RecordTransform.setField(obj, { value: 1234 } as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world' };
            const config = { field: 'other', value: 'stuff' };
            const expectResults = Object.assign({}, obj, { other: 'stuff' });

            expect(RecordTransform.setField([obj, undefined, null, '1234', 1234], config)).toEqual([expectResults]);
            expect(RecordTransform.setField([23, undefined], config)).toEqual([]);
        });
    });

    describe('dropFields', () => {
        it('can drop fields from a record', () => {
            const obj = { hello: 'world', other: 'stuff', last: 'thing' };
            const config = { fields: ['other', 'last'] };

            expect(RecordTransform.dropFields(cloneDeep(obj), config)).toEqual({ hello: 'world' });
            expect(RecordTransform.dropFields(null as any, config)).toEqual(null);
            expect(RecordTransform.dropFields(1234 as any, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.dropFields(obj, { from: [] as any, to: 1234 as any } as any)
            ).toThrow();
            expect(() => RecordTransform.dropFields(obj, null as any)).toThrow();
            expect(() => RecordTransform.dropFields(obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.dropFields(obj, { from: null as any } as any)).toThrow();
            expect(() => RecordTransform.dropFields(obj, undefined as any)).toThrow();
            expect(() => RecordTransform.dropFields(obj, { fields: '1234' as any })).toThrow();
            expect(() => RecordTransform.dropFields(obj, { fields: [1234] as any })).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world', other: 'stuff', last: 'thing' };
            const otherObj = { some: 1234 };
            const config = { fields: ['other', 'last'] };

            expect(RecordTransform.dropFields([obj, undefined, null, otherObj], config)).toEqual([{ hello: 'world' }, otherObj]);
            expect(RecordTransform.dropFields([23, undefined], config)).toEqual([]);
        });
    });

    describe('copyField', () => {
        it('can copy a field', () => {
            const obj = { hello: 'world', other: 'stuff' };
            const config = { from: 'other', to: 'myCopy' };

            expect(RecordTransform.copyField(cloneDeep(obj), config)).toEqual({ hello: 'world', other: 'stuff', myCopy: 'stuff' });
            expect(RecordTransform.copyField(null as any, config)).toEqual(null);
            expect(RecordTransform.copyField(1234 as any, config)).toEqual(null);
        });

        it('will throw if args are invalid', () => {
            const obj = { foo: true, bar: true };

            expect(
                () => RecordTransform.copyField(obj, { from: [] as any, to: 1234 as any })
            ).toThrow();
            expect(() => RecordTransform.copyField(obj, null as any)).toThrow();
            expect(() => RecordTransform.copyField(obj, 1234 as any)).toThrow();
            expect(() => RecordTransform.copyField(obj, { from: null as any } as any)).toThrow();
            expect(() => RecordTransform.copyField(obj, undefined as any)).toThrow();
        });

        it('can transform an array of values, ignores undefined/null', () => {
            const obj = { hello: 'world', other: 'stuff' };
            const otherObj = { num: 1234 };
            const config = { from: 'other', to: 'myCopy' };
            const results = { hello: 'world', other: 'stuff', myCopy: 'stuff' };

            const mixedData = [obj, undefined, null, otherObj];

            expect(RecordTransform.copyField(mixedData, config)).toEqual([results, otherObj]);
            expect(RecordTransform.copyField([23, undefined], config)).toEqual([]);
        });
    });
});
