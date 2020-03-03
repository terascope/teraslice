import 'jest-extended';
import {
    DataType, DataTypeConfig, LATEST_VERSION
} from '../src';

describe('DataType (elasticsearch)', () => {
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

        it('can create a elasticsearch 6 mapping', () => {
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

            expect(dataType.toESMapping({
                version: 6,
            })).toEqual(results);
        });

        it('can create a elasticsearch 7 mapping', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    foo: { type: 'String' },
                    bar: { type: 'String' },
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

            expect(dataType.toESMapping({ version: 7 })).toEqual(results);
        });

        it('can create an elasticsearch mapping with nested objects', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    config: { type: 'Object' },
                    'config.foo': { type: 'Byte' },
                    'config.path': { type: 'KeywordPathAnalyzer' },
                    'config.bar': { type: 'Object', indexed: false },
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
