
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
            expect(err.message).toInclude('No $version was specified in type_config');
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
            hello: 'string',
            location: 'geo',
            date: 'date',
            ip: 'ip',
            someNum: 'long'
        };

        const xluceneConfig = new DataTypes(typeConfig).toXlucene();
        expect(xluceneConfig).toEqual(results);
    });
});
