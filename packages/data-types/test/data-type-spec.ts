import 'jest-extended';
import { TSError } from '@terascope/utils';
import {
    DataType, DataTypeConfig, LATEST_VERSION, formatSchema
} from '../src';

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

        it('should work when given a valid config', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: { hello: { type: 'Keyword' } },
            };

            expect(() => new DataType(typeConfig)).not.toThrow();
        });

        it('should work when given a stringified version', () => {
            const typeConfig: DataTypeConfig = {
                // @ts-ignore
                version: `${LATEST_VERSION}`,
                fields: { hello: { type: 'Keyword' } },
            };

            expect(() => new DataType(typeConfig)).not.toThrow();
        });
    });

    describe('->toXlucene', () => {
        it('should return a valid xlucene type config', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const xluceneConfig = new DataType(typeConfig).toXlucene();
            expect(xluceneConfig).toEqual({
                hello: 'string',
                location: 'geoPoint',
                date: 'date',
                ip: 'ip',
                someNum: 'integer',
            });
        });
    });

    describe('->toGraqhQL', () => {
        it('should return graphql results', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    example_obj: { type: 'Object' },
                    someNum: { type: 'Long' },
                },
            };

            const dataType = new DataType(typeConfig, 'myType');
            const results = dataType.toGraphQL();

            const schema = formatSchema(`
                scalar JSONObject

                type DTGeoPointV1 {
                    lat: String!
                    lon: String!
                }

                type myType {
                    hello: String
                    location: DTGeoPointV1
                    date: String
                    ip: String
                    example_obj: JSONObject
                    someNum: Int
                }
            `);

            expect(results).toEqual(schema);
        });

        it('should handle the case when the is a nested field', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    'example.foo': { type: 'Keyword' },
                    'example.bar': { type: 'Keyword' },
                    'example.a': { type: 'Keyword' },
                    example: { type: 'Object' },
                },
            };

            const dataType = new DataType(typeConfig, 'ObjType');
            expect(dataType.toGraphQL()).toEqual(
                formatSchema(`
                    scalar JSONObject

                    type ObjType {
                        example: JSONObject
                    }
                `)
            );
        });

        it('should add type name at toGraphQL call', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const results = new DataType(typeConfig, 'myType').toGraphQL({ typeName: 'otherType' });
            const schema = formatSchema(`
                type DTGeoPointV1 {
                    lat: String!
                    lon: String!
                }

                type otherType {
                    hello: String
                    location: DTGeoPointV1
                    date: String
                    ip: String
                    someNum: Int
                }
            `);

            expect(results).toEqual(schema);
        });

        it('should throw when no name is provided with a toGraphQL call', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
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
    });

    describe('#mergeGraphQLSchemas', () => {
        it('can build a single graphql schema from multiple types', () => {
            const typeConfig1: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const typeConfig2: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    otherLocation: { type: 'GeoPoint' },
                    bool: { type: 'Boolean' },
                },
            };

            const types = [new DataType(typeConfig1, 'firstType'), new DataType(typeConfig2, 'secondType')];

            const results = DataType.mergeGraphQLDataTypes(types);
            const schema = formatSchema(`
                type firstType {
                    hello: String
                    location: DTGeoPointV1
                    date: String
                    ip: String
                    someNum: Int
                }

                type DTGeoPointV1 {
                    lat: String!
                    lon: String!
                }

                type secondType {
                    hello: String
                    location: DTGeoPointV1
                    otherLocation: DTGeoPointV1
                    bool: Boolean
                }
            `);

            expect(results).toEqual(schema);
        });

        it('should be able to combine mulitple types together with references', () => {
            const infoTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    id: { type: 'Text' },
                },
            };

            const childTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    long_number: { type: 'Long' },
                },
            };

            const parentTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    location: { type: 'GeoPoint' },
                    other_location: { type: 'GeoPoint' },
                    obj: { type: 'Object' },
                    some_date: { type: 'Date' },
                },
            };
            const types = [
                new DataType(infoTypeConfig, 'Info'),
                new DataType(childTypeConfig, 'ChildType'),
                new DataType(parentTypeConfig, 'ParentType'),
            ];

            const results = DataType.mergeGraphQLDataTypes(types, {
                __all: ['info(query: String): Info'],
                ChildType: ['num_parents: Int'],
                ParentType: ['children: ChildType'],
            });

            const schema = formatSchema(`
                scalar JSONObject

                type Info {
                    id: String
                    # references and virtual fields
                    info(query: String): Info
                }

                type ChildType {
                    hello: String
                    location: DTGeoPointV1
                    date: String
                    ip: String
                    long_number: Int
                    # references and virtual fields
                    info(query: String): Info
                    num_parents: Int
                }

                type DTGeoPointV1 {
                    lat: String!
                    lon: String!
                }

                type ParentType {
                    location: DTGeoPointV1
                    other_location: DTGeoPointV1
                    obj: JSONObject
                    some_date: String
                    # references and virtual fields
                    info(query: String): Info
                    children: ChildType
                }
            `);

            expect(results).toEqual(schema);
        });
    });

    describe('->toESMapping', () => {
        it('elasticsearch mapping requires providing a type name', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
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
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const results = {
                mappings: {
                    events: {
                        _all: {
                            enabled: false,
                        },
                        dynamic: false,
                        properties: {
                            hello: { type: 'text' },
                            location: { type: 'geo_point' },
                            date: { type: 'date' },
                            ip: { type: 'ip' },
                            someNum: { type: 'long' },
                        },
                    },
                },
                settings: {},
            };

            const dataType = new DataType(typeConfig);

            expect(dataType.toESMapping({ typeName: 'events' })).toEqual(results);
        });

        it('can add additional settings to a elasticsearch mapping', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'KeywordTokensCaseInsensitive' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const overrides = {
                settings: {
                    'index.number_of_shards': 5,
                    'index.number_of_replicas': 1,
                    analysis: {
                        analyzer: {
                            some_other_analyzer: {
                                tokenizer: 'keyword',
                                filter: 'lowercase',
                            },
                        },
                    },
                },
            };

            const dataType = new DataType(typeConfig, 'events');
            expect(dataType.toESMapping({ overrides })).toEqual({
                mappings: {
                    events: {
                        _all: {
                            enabled: false,
                        },
                        dynamic: false,
                        properties: {
                            hello: {
                                type: 'text',
                                analyzer: 'lowercase_keyword_analyzer',
                                fields: {
                                    tokens: {
                                        analyzer: 'standard',
                                        type: 'text',
                                    },
                                },
                            },
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
                            some_other_analyzer: {
                                tokenizer: 'keyword',
                                filter: 'lowercase',
                            },
                        },
                    },
                },
            });
        });
    });
});
