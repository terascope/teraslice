import 'jest-extended';
import { TSError } from '@terascope/core-utils';
import {
    isTemplatedIndex, isTimeSeriesIndex, validateIndexConfig,
    uniqueFieldQuery,
} from '../src/utils/index.js';

describe('Elasticsearch Store Utils', () => {
    describe('uniqueFieldQuery', () => {
        it('should return not return an dots for a valid string', () => {
            expect(
                uniqueFieldQuery('fooBar0123')
            ).toEqual('/[fF][oO][oO][bB][aA][rR]0123/');
        });

        it('should return . for each dash', () => {
            expect(
                uniqueFieldQuery('test-a-b-c')
            ).toEqual('/[tT][eE][sS][tT].[aA].[bB].[cC]/');
        });

        it('should return . for each underscore', () => {
            expect(
                uniqueFieldQuery('test_a_b_c')
            ).toEqual('/[tT][eE][sS][tT].[aA].[bB].[cC]/');
        });

        it('should return . for each special characters', () => {
            expect(
                uniqueFieldQuery('h*ll.?@^[]{})"\'`hih/\\ AND (')
            ).toEqual('/[hH].[lL][lL]............[hH][iI][hH]...[aA][nN][dD]../');
        });
    });

    describe('#isTemplatedIndex', () => {
        it('should return false when given a simple index', () => {
            expect(
                isTemplatedIndex({
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
                    template: true,
                    version: 1,
                })
            ).toBeTrue();
        });

        it('should return true when given a timeseries index', () => {
            expect(
                isTemplatedIndex({
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
});
