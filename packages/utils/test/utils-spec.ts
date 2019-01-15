import 'jest-extended';
import { DataEntity, isPlainObject, parseJSON, getTypeOf  } from '../src';

describe('Utils', () => {
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

    describe('parseJSON', () => {
        it('should handle a json encoded Buffer', () => {
            const input = Buffer.from(JSON.stringify({ foo: 'bar' }));
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        // TODO: We may need to add support for this?
        xit('should handle a json base64 encoded Buffer', () => {
            const input = Buffer.from(JSON.stringify({ foo: 'bar' }), 'base64');
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should handle a json encoded string', () => {
            const input = JSON.stringify({ foo: 'bar' });
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should throw a TypeError if given a non-buffer', () => {
            expect(() => {
                // @ts-ignore
                parseJSON(123);
            }).toThrowError('Failure to serialize non-buffer, got "Number"');
        });

        it('should throw an Error if given invalid json', () => {
            expect(() => {
                parseJSON(Buffer.from('foo:bar'));
            }).toThrowError(/^Failure to parse buffer, SyntaxError:/);
        });
    });

    describe('getTypeOf', () => {
        it('should return the correct kind', () => {
            expect(getTypeOf({})).toEqual('Object');

            expect(getTypeOf(new DataEntity({}))).toEqual('DataEntity');
            expect(getTypeOf(DataEntity.make({}))).toEqual('DataEntity');

            expect(getTypeOf([])).toEqual('Array');

            const fn = () => {
                return 123;
            };

            function hello() {
                return 'hello';
            }

            expect(getTypeOf(fn)).toEqual('Function');
            expect(getTypeOf(hello)).toEqual('Function');

            expect(getTypeOf(Buffer.from('hello'))).toEqual('Buffer');
            expect(getTypeOf('hello')).toEqual('String');

            expect(getTypeOf(123)).toEqual('Number');

            expect(getTypeOf(null)).toEqual('Null');
            expect(getTypeOf(undefined)).toEqual('Undefined');

            const error = new Error('Hello');
            expect(getTypeOf(error)).toEqual('Error');
        });
    });
});
