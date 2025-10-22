import 'jest-extended';
import { parseJSON } from '../src/json.js';

describe('Utils', () => {
    describe('parseJSON', () => {
        it('should handle a json encoded Buffer', () => {
            const input = Buffer.from(JSON.stringify({ foo: 'bar' }));
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should handle a json encoded Buffer with null unicode characters in a string value', () => {
            const input = Buffer.from('{ "foo": "bar\u0000\u0000", "field": "value 0 null here", "field2": null }');
            expect(parseJSON(input)).toEqual({ foo: 'bar', field: 'value 0 null here', field2: null });
        });

        it('should handle a json encoded Buffer with null hex code characters', () => {
            const input = Buffer.from('{ "foo": "bar\x00\x00" }');
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should handle a json string with null hex code characters', () => {
            const input = '{ "foo": "bar\x00\x00", "field": "value 0 null here", "field2": null }';
            expect(parseJSON(input)).toEqual({ foo: 'bar', field: 'value 0 null here', field2: null });
        });

        // TODO: We may need to add support for this?
        // eslint-disable-next-line jest/no-disabled-tests
        it.skip('should handle a json base64 encoded Buffer', () => {
            const input = Buffer.from(JSON.stringify({ foo: 'bar' }), 'base64');
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should handle a json encoded string', () => {
            const input = JSON.stringify({ foo: 'bar' });
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should throw a TypeError if given a non-buffer', () => {
            expect(() => {
                // @ts-expect-error
                parseJSON(123);
            }).toThrow('Failure to serialize non-buffer, got "Number"');
        });

        it('should throw an Error if given invalid json', () => {
            expect(() => {
                parseJSON(Buffer.from('foo:bar'));
            }).toThrow(/^Failure to parse buffer, SyntaxError:/);
        });
    });
});
