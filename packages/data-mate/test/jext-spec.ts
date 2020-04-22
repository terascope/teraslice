import { jexl } from '../src';

describe('jexl', () => {
    it('can run basic field transforms', () => {
        expect(jexl.evalSync('foo|toUpperCase', { foo: 'bar' })).toEqual('BAR');
    });

    it('can run field extractions', () => {
        expect(jexl.evalSync('foo|extract({}, { start: "b", end: "r"})', { foo: 'bar' })).toEqual('a');
        expect(jexl.evalSync('foo|extract({}, { jexl: "foo" })', { foo: 'bar' })).toEqual('bar');
        expect(jexl.evalSync('foo|extract({ foo: "bar" }, { jexlExp: "foo|toUpperCase" })', { foo: 'bar' })).toEqual('BAR');
    });

    it('can run field validations', () => {
        expect(jexl.evalSync('foo|isString', { foo: 'bar' })).toEqual(true);
        expect(jexl.evalSync('foo|isNumber', { foo: 'bar' })).toEqual(false);
        expect(jexl.evalSync('baz|isNumber', { baz: 234 })).toEqual(true);
    });

    it('can run record validations', () => {
        expect(jexl.evalSync('field|required({}, { fields: ["foo"]})', { field: { foo: 'bar' } })).toEqual({ foo: 'bar' });
    });

    it('can run record transforms', () => {
        expect(jexl.evalSync('field|dropFields({}, { fields: ["foo"]})', { field: { foo: 'bar', hello: 'there' } })).toEqual({ hello: 'there' });
    });
});
