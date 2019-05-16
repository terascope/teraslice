
import 'jest-extended';
import { DataTypes, DataTypeConfig } from '../src';
import { TSError } from '@terascope/utils';

describe('DataTypes', () => {

    it('it will throw without versioning', () => {
        expect.hasAssertions();
        try {
            // @ts-ignore
            new DataTypes({});
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

        expect(() => new DataTypes(typeConfig)).not.toThrow();
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

        const xluceneConfig = new DataTypes(typeConfig).toXlucene();
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

        const { results, baseType, customTypes } = new DataTypes(typeConfig, 'myType').toGraphQl();

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

        const { results } = new DataTypes(typeConfig, 'myType').toGraphQl('otherType');

        [
            'type otherType {',
        ].forEach((str: string) => {
            expect(results.match(str)).not.toBeNull();
        });
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
            new DataTypes(typeConfig).toGraphQl();
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No name was specified to create the graphql type representing this data structure');
        }
    });
});
