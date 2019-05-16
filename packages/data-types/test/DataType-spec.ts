
import 'jest-extended';
import { DataType, DataTypeConfig } from '../src';
import { TSError } from '@terascope/utils';

describe('DataType', () => {

    it('it will throw without versioning', () => {
        expect.hasAssertions();
        try {
            // @ts-ignore
            new DataType({});
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No version was specified in type_config');
        }
    });

    it('it can instantiate correctly', () => {
        const typeConfig: DataTypeConfig = {
            version: 1,
            fields: { hello: { type: 'keyword' } },
        };

        expect(() => new DataType(typeConfig)).not.toThrow();
    });

    it('it can return an xlucene ready typeconfig', () => {
        const typeConfig: DataTypeConfig = {
            version: 1,
            fields: {
                hello: { type: 'text' },
                location: { type: 'geo' },
                date: { type: 'date' },
                ip: { type: 'ip' },
                someNum: { type: 'long' }
            },
        };

        const results = {
            hello: 'text',
            location: 'geo',
            date: 'date',
            ip: 'ip',
            someNum: 'long'
        };

        const xluceneConfig = new DataType(typeConfig).toXlucene();
        expect(xluceneConfig).toEqual(results);
    });

    it('it can return graphql results', () => {
        const typeConfig: DataTypeConfig = {
            version: 1,
            fields: {
                hello: { type: 'text' },
                location: { type: 'geo' },
                date: { type: 'date' },
                ip: { type: 'ip' },
                someNum: { type: 'long' }
            },
        };

        const { results, baseType, customTypes } = new DataType(typeConfig, 'myType').toGraphQl();

        [
            'type myType {',
            'hello: String',
            'location: Geo',
            'date: DateTime',
            'ip: String',
            'someNum: Int',
            'type Geo {',
            'lat: String!',
            'lon: String!'
        ].forEach((str: string) => {
            expect(results.match(str)).not.toBeNull();
        });

        [
            'type myType {',
            'hello: String',
            'location: Geo',
            'date: DateTime',
            'ip: String',
            'someNum: Int',
        ].forEach((str: string) => {
            expect(baseType.match(str)).not.toBeNull();
        });

        expect(customTypes).toBeArrayOfSize(1);
        const customType = customTypes[0];

        [
            'type Geo {',
            'lat: String!',
            'lon: String!'
        ].forEach((str: string) => {
            expect(customType.match(str)).not.toBeNull();
        });
    });

    it('it can add type name at toGraphQl call', () => {
        const typeConfig: DataTypeConfig = {
            version: 1,
            fields: {
                hello: { type: 'text' },
                location: { type: 'geo' },
                date: { type: 'date' },
                ip: { type: 'ip' },
                someNum: { type: 'long' }
            },
        };

        const { results } = new DataType(typeConfig, 'myType').toGraphQl('otherType');

        expect(results.match('type otherType {')).not.toBeNull();
        expect(results.match('type myType {')).toBeNull();
    });

    it('it throws when no name is provided with a toGraphQl call', () => {
        const typeConfig: DataTypeConfig = {
            version: 1,
            fields: {
                hello: { type: 'text' },
                location: { type: 'geo' },
                date: { type: 'date' },
                ip: { type: 'ip' },
                someNum: { type: 'long' }
            },
        };

        try {
            new DataType(typeConfig).toGraphQl();
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No name was specified to create the graphql type representing this data structure');
        }
    });
});
