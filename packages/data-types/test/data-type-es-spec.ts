import 'jest-extended';
import { DataTypeConfig, ElasticsearchDistribution, FieldType } from '@terascope/types';
import {
    DataType, LATEST_VERSION, ESMappingOptions
} from '../src';

describe('DataType (elasticsearch)', () => {
    describe('->toESMapping', () => {
        it('elasticsearch mapping requires providing a type name', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
                },
            };

            try {
                new DataType(typeConfig).toESMapping();
            } catch (err) {
                expect(err.message).toInclude("Cannot destructure property `typeName` of 'undefined' or 'null'.");
            }
        });

        it('can create a elasticsearch 6 mapping', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
                },
            };

            const results = {
                mappings: {
                    _doc: {
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

            const mappingConfig: ESMappingOptions = {
                distribution: ElasticsearchDistribution.elasticsearch,
                minorVersion: 8,
                majorVersion: 6,
                version: '6.8.6'
            };

            expect(dataType.toESMapping(mappingConfig)).toEqual(results);
        });

        it('can create a elasticsearch 7 mapping', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    foo: { type: FieldType.String },
                    bar: { type: FieldType.String },
                },
            };

            const results = {
                mappings: {
                    dynamic: false,
                    properties: {
                        foo: { type: 'keyword' },
                        bar: { type: 'keyword' },
                    },
                },
                settings: {},
            };

            const dataType = new DataType(typeConfig);
            const mappingConfig: ESMappingOptions = {
                distribution: ElasticsearchDistribution.elasticsearch,
                minorVersion: 3,
                majorVersion: 7,
                version: '7.3.1'
            };

            expect(dataType.toESMapping(mappingConfig)).toEqual(results);
        });

        it('can create an elasticsearch mapping with nested objects', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    config: { type: FieldType.Object },
                    'config.foo': { type: FieldType.Byte },
                    'config.path': { type: FieldType.KeywordPathAnalyzer },
                    'config.bar': { type: FieldType.Object, indexed: false },
                },
            };

            const output = new DataType(typeConfig).toESMapping({ typeName: 'events' });

            expect(output).toHaveProperty('mappings.events.properties', {
                config: {
                    type: 'object',
                    properties: {
                        foo: { type: 'byte' },
                        bar: {
                            type: 'object',
                            enabled: false
                        },
                        path: {
                            fields: {
                                tokens: {
                                    analyzer: 'path_analyzer',
                                    type: 'text'
                                }
                            },
                            type: 'keyword'
                        }
                    }
                },
            });

            expect(output).toHaveProperty('settings', {
                analysis: {
                    analyzer: {
                        path_analyzer: {
                            type: 'custom',
                            tokenizer: 'path_tokenizer'
                        },
                    },
                    tokenizer: {
                        path_tokenizer: {
                            type: 'pattern',
                            pattern: '/'
                        }
                    }
                },
            });
        });

        it('can add additional settings to a elasticsearch mapping', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.KeywordTokensCaseInsensitive },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
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
