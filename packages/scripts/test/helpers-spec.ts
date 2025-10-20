import 'jest-extended';
import * as index from '../src';
import * as config from '../src/helpers/config';
import { makeArray } from '../src/helpers/args';
import { getName } from '../src/helpers/misc';

describe('Helpers', () => {
    it('should export an object', () => {
        expect(index).toBeObject();
    });

    it('should be able to have a config', () => {
        expect(config).toHaveProperty('HOST_IP');
        expect(config).toHaveProperty('ELASTICSEARCH_HOST');
        expect(config).toHaveProperty('KAFKA_BROKER');
    });

    describe('->makeArray', () => {
        it('should handle being called string', () => {
            expect(makeArray('hello')).toEqual(['hello']);
        });

        it('should handle being called empty string', () => {
            expect(makeArray('')).toEqual([]);
        });

        it('should handle being called with an array of strings', () => {
            expect(makeArray(['hello'])).toEqual(['hello']);
        });

        it('should handle being called with an array of empty strings', () => {
            expect(makeArray([''])).toEqual([]);
        });

        it('should handle being called with undefined', () => {
            expect(makeArray(undefined)).toEqual([]);
        });
    });

    it('should be able to convert a package name to something readable', () => {
        expect(getName('hello')).toEqual('Hello');
        expect(getName('hi-there')).toEqual('Hi There');
        expect(getName('hi there')).toEqual('Hi There');
    });
});
