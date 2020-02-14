import { RecordValidator } from '../src';

describe('record validators', () => {
    it('can require fields', () => {
        const obj1 = { foo: true, bar: true };
        const obj2 = { foo: true };
        const fields = ['bar'];

        const results1 = RecordValidator.required(obj1, { fields });
        const results2 = RecordValidator.required(obj2, { fields });

        expect(results1).toEqual(true);
        expect(results2).toEqual(false);
    });

    it('can select fields', () => {
        const obj1 = { foo: true, bar: true };
        const obj2 = { foo: true };
        const args = { query: '_exists_:bar' };

        const results1 = RecordValidator.select(obj1, args);
        const results2 = RecordValidator.select(obj2, args);

        expect(results1).toEqual(true);
        expect(results2).toEqual(false);
    });

    it('can reject fields', () => {
        const obj1 = { foo: true, bar: true };
        const obj2 = { foo: true };
        const args = { query: '_exists_:bar' };

        const results1 = RecordValidator.reject(obj1, args);
        const results2 = RecordValidator.reject(obj2, args);

        expect(results1).toEqual(false);
        expect(results2).toEqual(true);
    });
});
