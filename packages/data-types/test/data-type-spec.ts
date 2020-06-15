import 'jest-extended';
import { TSError } from '@terascope/utils';
import {
    DataType, DataTypeConfig, LATEST_VERSION
} from '../src';

describe('DataType', () => {
    it('should not throw when given an empty object', () => {
        expect(() => new DataType({})).not.toThrow();
    });

    it('should throw when given no version', () => {
        expect.hasAssertions();
        try {
            new DataType({
                // @ts-expect-error
                version: null,
                fields: {},
            });
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('Missing version in data type config');
        }
    });

    it('should throw when given a unknown version', () => {
        expect.hasAssertions();
        try {
            new DataType({
                // @ts-expect-error
                version: 999,
                fields: {},
            });
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('Unknown data type version 999');
        }
    });

    it('should throw when missing fields', () => {
        expect.hasAssertions();
        try {
            new DataType({
                version: 1,
                // @ts-expect-error
                fields: null,
            });
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('Invalid fields was specified in data type config');
        }
    });

    it('should throw when given invalid field type configs', () => {
        expect.hasAssertions();
        try {
            new DataType({
                version: 1,
                fields: {
                    blah: true,
                } as any,
            });
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('Invalid type config for field "blah" in data type config');
        }
    });

    it('should work when given a valid config', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: { hello: { type: 'Keyword' } },
        };

        expect(() => new DataType(typeConfig)).not.toThrow();
    });

    it('should work when given a stringified version', () => {
        const typeConfig: DataTypeConfig = {
            // @ts-expect-error
            version: `${LATEST_VERSION}`,
            fields: { hello: { type: 'Keyword' } },
        };

        expect(() => new DataType(typeConfig)).not.toThrow();
    });

    it('should persist name, version, fields and description', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: { hello: { type: 'Keyword' } },
        };

        const dataType = new DataType(typeConfig, 'Test', 'hello there');
        expect(dataType).toHaveProperty('name', 'Test');
        expect(dataType).toHaveProperty('description', 'hello there');
        expect(dataType).toHaveProperty('fields', typeConfig.fields);
        expect(dataType).toHaveProperty('version', typeConfig.version);
        expect(dataType).toHaveProperty('groupedFields', {
            hello: ['hello']
        });
    });

    it('should have correctly grouped fields list', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Keyword' },
                foo: { type: 'Object' },
                'foo.bar': { type: 'Keyword' },
                'foo.baz': { type: 'Keyword' },
            },
        };

        const dataType = new DataType(typeConfig, 'Test', 'hello there');
        expect(dataType).toHaveProperty('groupedFields', {
            hello: ['hello'],
            foo: ['foo', 'foo.bar', 'foo.baz']
        });
    });
});
