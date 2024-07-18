import { jexl } from '../src/index.js';

describe('jexl', () => {
    it('can run basic field transforms', () => {
        expect(jexl.evalSync('foo|toUpperCase', { foo: 'bar' })).toEqual('BAR');
    });

    it('can run field extractions', async () => {
        expect(jexl.evalSync('foo|extract({ start: "b", end: "r"})', { foo: 'bar' })).toEqual('a');
        expect(jexl.evalSync('foo|extract({ jexl: "foo" })', { foo: 'bar' })).toEqual('bar');
        expect(jexl.evalSync('foo|extract({ jexlExp: "foo|toUpperCase" })', { foo: 'bar' })).toEqual('BAR');
    });

    it('can run field validations', () => {
        expect(jexl.evalSync('foo|isString', { foo: 'bar' })).toEqual(true);
        expect(jexl.evalSync('foo|isNumber', { foo: 'bar' })).toEqual(false);
        expect(jexl.evalSync('baz|isNumber', { baz: 234 })).toEqual(true);
    });
});
