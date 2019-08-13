import 'jest-extended';
import {
    DataEntity,
    isPlainObject,
} from '../src';

describe('Objects', () => {
    describe('isPlainObject', () => {
        class TestObj {

        }

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
});
