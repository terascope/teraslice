import 'jest-extended';
import { TSError } from '@terascope/utils';
import {
    isSimpleIndex,
    isTemplatedIndex,
    isTimeSeriesIndex,
    validateIndexConfig,
} from '../src/utils';

describe('Elasticsearch Store Utils', () => {
    describe('#isSimpleIndex', () => {
        it('should return true when given a simple index', () => {
            expect(isSimpleIndex({
                mapping: {},
                version: 1
            })).toBeTrue();
        });

        it('should return false when given missing map', () => {
            // @ts-ignore
            expect(isSimpleIndex({
                version: 'v1'
            })).toBeFalse();
        });

        it('should return false when given a templated index', () => {
            // @ts-ignore
            expect(isSimpleIndex({
                mapping: {},
                template: true,
                version: 1
            })).toBeFalse();
        });
    });

    describe('#isTemplatedIndex', () => {
        it('should return false when given a simple index', () => {
            expect(isTemplatedIndex({
                mapping: {},
                template: false,
                version: 1
            })).toBeFalse();
        });

        it('should return false when given missing map', () => {
            // @ts-ignore
            expect(isTemplatedIndex({
                version: 'v1'
            })).toBeFalse();
        });

        it('should return true when given a templated index', () => {
            // @ts-ignore
            expect(isTemplatedIndex({
                mapping: {},
                template: true,
                version: 'v1'
            })).toBeTrue();
        });

        it('should return true when given a timeseries index', () => {
            // @ts-ignore
            expect(isTemplatedIndex({
                mapping: {},
                template: true,
                timeseries: true,
                version: 1
            })).toBeTrue();
        });
    });

    describe('#isTimeSeriesIndex', () => {
        it('should return false when given a simple index', () => {
            expect(isTimeSeriesIndex({
                mapping: {},
                template: false,
                version: 1
            })).toBeFalse();
        });

        it('should return false when given missing map', () => {
            // @ts-ignore
            expect(isTimeSeriesIndex({
                version: 1
            })).toBeFalse();
        });

        it('should return false when given a templated index', () => {
            // @ts-ignore
            expect(isTimeSeriesIndex({
                mapping: {},
                template: true,
                version: 1
            })).toBeFalse();
        });

        it('should return true when given a timeseries index', () => {
            // @ts-ignore
            expect(isTimeSeriesIndex({
                mapping: {},
                template: true,
                timeseries: true,
                version: 1
            })).toBeTrue();
        });
    });

    describe('#validateIndexConfig', () => {
        const validateIndexMsg = /Invalid name, must be a non-empty string and cannot contain a "-"/;

        describe('when passed an invalid config object', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    validateIndexConfig();
                }).toThrowWithMessage(TSError, /IndexConfig cannot be empty/);
            });
        });

        describe('when passed an empty name', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    validateIndexConfig({ index: '' });
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passed an name as a number', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    validateIndexConfig({ index: 123 });
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passed an invalid name format', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    validateIndexConfig({ name: 'hello-hi-' });
                }).toThrowWithMessage(TSError, validateIndexMsg);
            });
        });

        describe('when passsed a invalid version config', () => {
            it('should throw if a string is used for the Index Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        // @ts-ignore
                        indexSchema: {
                            mapping: {},
                            version: '8'
                        },
                        version: 8,
                        index: 'hello'
                    });
                }).toThrowWithMessage(TSError, /Index Version must a Integer, got "String"/);
            });

            it('should throw if a negative integer is used for the Index Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        indexSchema: {
                            mapping: {},
                            version: -8
                        },
                        version: 8,
                        index: 'hello'
                    });
                }).toThrowWithMessage(TSError, /Index Version must be greater than 0, got "-8"/);
            });

            it('should throw if a string is used for the Data Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        indexSchema: {
                            mapping: {},
                            version: 8
                        },
                            // @ts-ignore
                        version: '8',
                        index: 'hello'
                    });
                }).toThrowWithMessage(TSError, /Data Version must a Integer, got "String"/);
            });

            it('should throw if a negative integer is used for the Data Schema version', () => {
                expect(() => {
                    validateIndexConfig({
                        indexSchema: {
                            mapping: {},
                            version: 8
                        },
                        version: -8,
                        index: 'hello'
                    });
                }).toThrowWithMessage(TSError, /Data Version must be greater than 0, got "-8"/);
            });
        });
    });
});
