import 'jest-extended';
import { DataTypeConfig, FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '../src/index.js';
import TupleType from '../src/types/tuple-type.js';
import GroupType from '../src/types/group-type.js';

describe('DataType', () => {
    it('should not throw when given an empty object', () => {
        expect(() => new DataType({})).not.toThrow();
    });

    it('should throw when given no version', () => {
        expect(() => {
            new DataType({
                // @ts-expect-error
                version: null,
                fields: {},
            });
        }).toThrow('Missing version in data type config');
    });

    it('should throw when given a unknown version', () => {
        expect(() => {
            new DataType({
                version: 999,
                fields: {},
            });
        }).toThrow('Unknown data type version 999');
    });

    it('should throw when missing fields', () => {
        expect(() => {
            new DataType({
                version: 1,
                // @ts-expect-error
                fields: null,
            });
        }).toThrow('Invalid fields was specified in data type config');
    });

    it('should throw when given invalid field type configs', () => {
        expect(() => {
            new DataType({
                version: 1,
                fields: {
                    blah: true,
                } as any,
            });
        }).toThrow('Invalid type config for field "blah" in data type config');
    });

    it('should work when given a valid config', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: { hello: { type: FieldType.Keyword } },
        };

        expect(() => new DataType(typeConfig)).not.toThrow();
    });

    it('should work when given a stringified version', () => {
        const typeConfig: DataTypeConfig = {
            // @ts-expect-error
            version: `${LATEST_VERSION}`,
            fields: { hello: { type: FieldType.Keyword } },
        };

        expect(() => new DataType(typeConfig)).not.toThrow();
    });

    it('should persist name, version, fields and description', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: { hello: { type: FieldType.Keyword } },
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
                hello: { type: FieldType.Keyword },
                foo: { type: FieldType.Object },
                'foo.bar': { type: FieldType.Keyword },
                'foo.baz': { type: FieldType.Keyword },
            },
        };

        const dataType = new DataType(typeConfig, 'Test', 'hello there');
        expect(dataType).toHaveProperty('groupedFields', {
            hello: ['hello'],
            foo: ['foo', 'foo.bar', 'foo.baz']
        });
        // @ts-expect-error
        const types = dataType._types;
        expect(types.find((t) => t.config.type === FieldType.Object)).toBeInstanceOf(GroupType);
    });

    it('should have correctly with a tuple fields list', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: FieldType.Keyword },
                foo: { type: FieldType.Tuple },
                'foo.0': { type: FieldType.Keyword },
                'foo.1': { type: FieldType.Integer },
            },
        };

        const dataType = new DataType(typeConfig, 'Test', 'hello there');
        expect(dataType).toHaveProperty('groupedFields', {
            hello: ['hello'],
            foo: ['foo', 'foo.0', 'foo.1']
        });
        // @ts-expect-error
        const types = dataType._types;
        expect(types.find((t) => t.config.type === FieldType.Tuple)).toBeInstanceOf(TupleType);
    });
});
