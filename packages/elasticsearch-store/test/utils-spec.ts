import 'jest-extended';
import { TSError } from '@terascope/utils';
import {
    isSimpleIndex,
    isTemplatedIndex,
    isTimeSeriesIndex,
    validateIndexConfig,
    getFirstValue,
    getFirstKey,
    getXLuceneTypesFromMapping,
} from '../src/utils';

describe('Elasticsearch Store Utils', () => {
    describe('#isSimpleIndex', () => {
        it('should return true when given a simple index', () => {
            expect(
                isSimpleIndex({
                    mapping: { properties: {} },
                    version: 1,
                })
            ).toBeTrue();
        });

        it('should return false when given missing map', () => {
            expect(
                isSimpleIndex({
                    version: 'v1',
                } as any)
            ).toBeFalse();
        });

        it('should return false when given a templated index', () => {
            expect(
                isSimpleIndex({
                    mapping: { properties: {} },
                    template: true,
                    version: 1,
                })
            ).toBeFalse();
        });
    });

    describe('#isTemplatedIndex', () => {
        it('should return false when given a simple index', () => {
            expect(
                isTemplatedIndex({
                    mapping: { properties: {} },
                    template: false,
                    version: 1,
                })
            ).toBeFalse();
        });

        it('should return false when given missing map', () => {
            expect(
                isTemplatedIndex({
                    version: 'v1',
                } as any)
            ).toBeFalse();
        });

        it('should return true when given a templated index', () => {
            expect(
                isTemplatedIndex({
                    mapping: { properties: {} },
                    template: true,
                    version: 1,
                })
            ).toBeTrue();
        });

        it('should return true when given a timeseries index', () => {
            expect(
                isTemplatedIndex({
                    mapping: {
                        properties: {},
                    },
                    template: true,
                    timeseries: true,
                    version: 1,
                })
            ).toBeTrue();
        });
    });

    describe('#isTimeSeriesIndex', () => {
        it('should return false when given a simple index', () => {
            expect(
                isTimeSeriesIndex({
                    mapping: {
                        properties: {},
                    },
                    template: false,
                    version: 1,
                })
            ).toBeFalse();
        });

        it('should return false when given missing map', () => {
            expect(
                isTimeSeriesIndex({
                    version: 1,
                } as any)
            ).toBeFalse();
        });

        it('should return false when given a templated index', () => {
            expect(
                isTimeSeriesIndex({
                    mapping: { properties: {} },
                    template: true,
                    version: 1,
                })
            ).toBeFalse();
        });

        it('should return true when given a timeseries index', () => {
            expect(
                isTimeSeriesIndex({
                    mapping: { properties: {} },
                    template: true,
                    timeseries: true,
                    version: 1,
                } as any)
            ).toBeTrue();
        });
    });

    describe('#validateIndexConfig', () => {
        const validateIndexMsg = /Invalid name, must be a non-empty string and cannot contain a "-"/;
        const validateNamespaceMsg = /Invalid namespace, must be a non-empty string and cannot contain a "-"/;

        describe('when passed an invalid config object', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig(undefined as any);
                }).toThrowWithMessage(TSError, /IndexConfig cannot be empty/);
            });
        });

        describe('when passed no name', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({});
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passed an empty name', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: '' });
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passed an name as a number', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: 123 });
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passed an invalid name format', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: 'hello-hi-' });
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passed without a namespace', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: 'hi' });
                }).not.toThrowWithMessage(TSError, validateNamespaceMsg);
            });
        });

        describe('when passed an empty namespace', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: 'hi', namespace: '' });
                }).toThrowWithMessage(TSError, validateNamespaceMsg);
            });
        });

        describe('when passed an namespace as a number', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: 'hi', namespace: 321 });
                }).toThrowWithMessage(TSError, validateNamespaceMsg);
            });
        });

        describe('when passed an invalid namespace format', () => {
            it('should throw an error', () => {
                expect(() => {
                    validateIndexConfig({ name: 'hello', namespace: 'hello-hi-' });
                }).toThrowWithMessage(TSError, validateNamespaceMsg);
            });
        });

        describe('when passed a invalid version config', () => {
            it('should throw if a string is used for the Index Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        index_schema: {
                            mapping: { properties: {} },
                            version: '8',
                        },
                        version: 8,
                        index: 'hello',
                    });
                }).toThrowWithMessage(TSError, /Index Version must a Integer, got "String"/);
            });

            it('should throw if a negative integer is used for the Index Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        index_schema: {
                            mapping: { properties: {} },
                            version: -8,
                        },
                        version: 8,
                        index: 'hello',
                    });
                }).toThrowWithMessage(TSError, /Index Version must be greater than 0, got "-8"/);
            });

            it('should throw if a string is used for the Data Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        index_schema: {
                            mapping: { properties: {} },
                            version: 8,
                        },
                        version: '8',
                        index: 'hello',
                    });
                }).toThrowWithMessage(TSError, /Data Version must a Integer, got "String"/);
            });

            it('should throw if a negative integer is used for the Data Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        index_schema: {
                            mapping: { properties: {} },
                            version: 8,
                        },
                        version: -8,
                        index: 'hello',
                    });
                }).toThrowWithMessage(TSError, /Data Version must be greater than 0, got "-8"/);
            });
        });
    });

    describe('#getFirstValue', () => {
        describe('when given an object', () => {
            it('should return the first value', () => {
                const obj = { key1: 1, key2: 2 };
                expect(getFirstValue(obj)).toEqual(1);
            });
        });

        describe('when given an empty object', () => {
            it('should return nil', () => {
                expect(getFirstValue({})).toBeNil();
            });
        });
    });

    describe('#getFirstKey', () => {
        describe('when given an object', () => {
            it('should return the first value', () => {
                const obj = { key1: 1, key2: 2 };
                expect(getFirstKey(obj)).toEqual('key1');
            });
        });

        describe('when given an empty object', () => {
            it('should return nil', () => {
                expect(getFirstKey({})).toBeNil();
            });
        });
    });

    describe('#getXLuceneTypesFromMapping', () => {
        describe('when given a mapping', () => {
            const mapping = {
                _all: {
                    enabled: false,
                },
                dynamic: false,
                properties: {
                    test_keyword: {
                        type: 'keyword',
                    },
                    test_text: {
                        type: 'text',
                    },
                    test_numeric: {
                        type: 'integer',
                    },
                    test_boolean: {
                        type: 'boolean',
                    },
                    test_integer_range: {
                        type: 'integer_range',
                    },
                    test_date: {
                        type: 'date',
                    },
                    test_object: {
                        properties: {
                            nested_ip: {
                                type: 'ip',
                            },
                            nested_geo: {
                                properties: {
                                    test_location: {
                                        type: 'geo_point',
                                    },
                                },
                            },
                        },
                    },
                    test_ip: {
                        type: 'ip',
                    },
                    test_geo_point: {
                        type: 'geo_point',
                    },
                    test_geo_shape: {
                        type: 'geo_shape',
                    },
                },
            };

            it('should return test_keyword:term', () => {
                const result = getXLuceneTypesFromMapping(mapping);
                expect(result).toEqual({
                    test_boolean: 'boolean',
                    test_date: 'date',
                    'test_object.nested_ip': 'ip',
                    'test_object.nested_geo.test_location': 'geo',
                    test_keyword: 'string',
                    test_numeric: 'integer',
                    test_ip: 'ip',
                    test_geo_point: 'geo',
                    test_geo_shape: 'geo',
                    test_text: 'string'
                });
            });
        });
    });
});
