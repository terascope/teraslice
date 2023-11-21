import 'jest-extended';
import * as index from '../src';
import * as config from '../src/helpers/config';
import { makeArray } from '../src/helpers/args';
import { getName } from '../src/helpers/misc';
import { kafkaVersionMapper } from '../src/helpers/mapper';

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

    describe('->kakfaVersionMapper', () => {
        it('should throw error on invalid kafka versions', () => {
            expect(() => kafkaVersionMapper('2.3')).toThrow();
            expect(() => kafkaVersionMapper('2.9')).toThrow();
            expect(() => kafkaVersionMapper('3')).toThrow();
            expect(() => kafkaVersionMapper('3.6')).toThrow();
            expect(() => kafkaVersionMapper('4.0')).toThrow();
        });

        it('should be able to convert kafka versions to the proper confluent/cp-kafka versions', () => {
            expect(kafkaVersionMapper('3.1')).toBe('7.1.9');
            expect(kafkaVersionMapper('3.5')).toBe('7.5.1');
            expect(kafkaVersionMapper('2.4')).toBe('5.4.10');
            expect(kafkaVersionMapper('2.8')).toBe('6.2.12');
        });
    });
});
