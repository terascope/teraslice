import 'jest-extended';
import { DataType, DataTypeConfig, LATEST_VERSION, formatSchema } from '../src';
import { TSError } from '@terascope/utils';

describe('DataType', () => {
    describe('when constructing', () => {
        it('should throw when given an empty object', () => {
            expect.hasAssertions();
            try {
                // @ts-ignore
                new DataType({});
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing data type config');
            }
        });

        it('should throw when given no version', () => {
            expect.hasAssertions();
            try {
                new DataType({
                    // @ts-ignore
                    version: null,
                    fields: {},
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing version in data type config');
            }
        });

        it('should throw when given a non-integer version', () => {
            expect.hasAssertions();
            try {
                new DataType({
                    // @ts-ignore
                    version: '1',
                    fields: {},
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid version was specified in data type config');
            }
        });

        it('should throw when given a unknown version', () => {
            expect.hasAssertions();
            try {
                new DataType({
                    // @ts-ignore
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
                    // @ts-ignore
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
                        // @ts-ignore
                        blah: true,
                    },
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid type config for field "blah" in data type config');
            }
        });

        it('should instantiate correctly', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: { hello: { type: 'Keyword' } },
            };

            expect(() => new DataType(typeConfig)).not.toThrow();
        });
    });

    it('should return an xlucene ready typeconfig', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const results = {
            hello: 'string',
            location: 'geo',
            date: 'date',
            ip: 'ip',
            someNum: 'number',
        };

        const xluceneConfig = new DataType(typeConfig).toXlucene();
        expect(xluceneConfig).toEqual(results);
    });

    it('should return graphql results', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const dataType = new DataType(typeConfig, 'myType');
        const results = dataType.toGraphQL();

        const schema = formatSchema(`
            scalar DateTime

            type GeoPointType {
                lat: String!
                lon: String!
            }

            type myType {
                hello: String
                location: GeoPointType
                date: DateTime
                ip: String
                someNum: Int
            }
        `);

        expect(results).toEqual(schema);
    });

    it('should add type name at toGraphQL call', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const results = new DataType(typeConfig, 'myType').toGraphQL({ typeName: 'otherType' });
        const schema = formatSchema(`
            scalar DateTime

            type GeoPointType {
                lat: String!
                lon: String!
            }

            type otherType {
                hello: String
                location: GeoPointType
                date: DateTime
                ip: String
                someNum: Int
            }
        `);

        expect(results).toEqual(schema);
    });

    it('should add default types for toGraphQL', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };
        const typeInjection = 'world: String';
        const results = new DataType(typeConfig, 'myType').toGraphQL({ typeInjection });
        const schema = formatSchema(`
            scalar DateTime

            type GeoPointType {
                lat: String!
                lon: String!
            }

            type myType {
                world: String
                hello: String
                location: GeoPointType
                date: DateTime
                ip: String
                someNum: Int
            }
        `);

        expect(results).toEqual(schema);
    });

    it('it throws when no name is provided with a toGraphQL call', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        try {
            new DataType(typeConfig).toGraphQL();
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No typeName was specified to create the graphql type representing this data structure');
        }
    });

    it('elasticsearch mapping requires providing a type name', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        try {
            // @ts-ignore
            new DataType(typeConfig).toESMapping();
        } catch (err) {
            expect(err.message).toInclude("Cannot destructure property `typeName` of 'undefined' or 'null'.");
        }
    });

    it('can create an elasticsearch mapping', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const results = {
            mappings: {
                events: {
                    properties: {
                        hello: { type: 'text' },
                        location: { type: 'geo_point' },
                        date: { type: 'date' },
                        ip: { type: 'ip' },
                        someNum: { type: 'long' },
                    },
                },
            },
            settings: {
                analysis: {
                    analyzer: {},
                    tokenizer: {},
                },
            },
        };

        const mapping = new DataType(typeConfig).toESMapping({ typeName: 'events' });
        expect(mapping).toEqual(results);
    });

    it('can add additional settings to a elasticsearch mapping', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const settings = {
            'index.number_of_shards': 5,
            'index.number_of_replicas': 1,
            analysis: {
                analyzer: {
                    lowercase_keyword_analyzer: {
                        tokenizer: 'keyword',
                        filter: 'lowercase',
                    },
                },
            },
        };

        const results = {
            mappings: {
                events: {
                    properties: {
                        hello: { type: 'text' },
                        location: { type: 'geo_point' },
                        date: { type: 'date' },
                        ip: { type: 'ip' },
                        someNum: { type: 'long' },
                    },
                },
            },
            settings: {
                'index.number_of_shards': 5,
                'index.number_of_replicas': 1,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase',
                        },
                    },
                    tokenizer: {},
                },
            },
        };

        const mapping = new DataType(typeConfig).toESMapping({ typeName: 'events', settings });
        expect(mapping).toEqual(results);
    });

    it('can build a single graphql schema from multiple types', () => {
        const typeConfig1: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const typeConfig2: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                otherLocation: { type: 'Geo' },
                bool: { type: 'Boolean' },
            },
        };

        const types = [new DataType(typeConfig1, 'firstType'), new DataType(typeConfig2, 'secondType')];

        const results = DataType.mergeGraphQLDataTypes(types);
        const schema = formatSchema(`
            scalar DateTime

            type firstType {
                hello: String
                location: GeoPointType
                date: DateTime
                ip: String
                someNum: Int
            }

            type GeoPointType {
                lat: String!
                lon: String!
            }

            type secondType {
                hello: String
                location: GeoPointType
                otherLocation: GeoPointType
                bool: Boolean
            }
        `);

        expect(results).toEqual(schema);
    });

    it('can inject additional field values when merging multipe types', () => {
        const typeConfig1: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const typeConfig2: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                otherLocation: { type: 'Geo' },
                bool: { type: 'Boolean' },
            },
        };
        const typeInjection = `
                injectedField: String
                anotherInjectedField: Boolean
        `;
        const types = [new DataType(typeConfig1, 'firstType'), new DataType(typeConfig2, 'secondType')];

        const results = DataType.mergeGraphQLDataTypes(types, typeInjection);
        const schema = formatSchema(`
            scalar DateTime

            type firstType {
                injectedField: String
                anotherInjectedField: Boolean
                hello: String
                location: GeoPointType
                date: DateTime
                ip: String
                someNum: Int
            }

            type GeoPointType {
                lat: String!
                lon: String!
            }

            type secondType {
                injectedField: String
                anotherInjectedField: Boolean
                hello: String
                location: GeoPointType
                otherLocation: GeoPointType
                bool: Boolean
            }
        `);

        expect(results).toEqual(schema);
    });
});
