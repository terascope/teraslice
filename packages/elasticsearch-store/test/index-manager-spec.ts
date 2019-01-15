import 'jest-extended';
import es from 'elasticsearch';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexManager } from '../src';

describe('IndexManager', () => {
    const client = new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error'
    });

    describe('when constructed with nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexManager();
            }).toThrowError('IndexManager requires elasticsearch client');
        });
    });

    describe('when constructed', () => {
        const indexManager = new IndexManager(client);

        describe('->formatIndexName', () => {
            describe('when passed no versions', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                    });

                    expect(indexName).toEqual('hello-v1-s1');
                });
            });

            describe('when passed a timeseries config', () => {
                it('should return a correctly formatted index name if useWildCard is set to false', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                        indexSchema: {
                            version: 1,
                            mapping: {},
                            template: true,
                            timeseries: true
                        },
                    }, false);

                    const dateStr = new Date().toISOString().slice(0, 7).replace(/-/g, '.');
                    expect(indexName).toEqual(`hello-v1-s1-${dateStr}`);
                });

                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                        indexSchema: {
                            version: 1,
                            mapping: {},
                            template: true,
                            timeseries: true
                        },
                    });

                    expect(indexName).toEqual('hello-v1-s1*');
                });
            });

            describe('when passed different versions', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                        version: 3,
                        indexSchema: {
                            version: 2,
                            mapping: {}
                        }
                    });

                    expect(indexName).toEqual('hello-v3-s2');
                });
            });

            describe('when passed an invalid config object', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-ignore
                        indexManager.formatIndexName();
                    }).toThrowError('Invalid config passed to formatIndexName');
                });
            });

            describe('when passed an empty index', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-ignore
                        indexManager.formatIndexName({ index: '' });
                    }).toThrowError('Invalid config passed to formatIndexName');
                });
            });

            describe('when passed an index as a number', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-ignore
                        indexManager.formatIndexName({ index: 123 });
                    }).toThrowError('Invalid config passed to formatIndexName');
                });
            });

            describe('when passed an invalid index format', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-ignore
                        indexManager.formatIndexName({ index: 'hello-hi-' });
                    }).toThrowError('Invalid index name, must not be include "-"');
                });
            });
        });

        describe('->formatTemplateName', () => {
            describe('when passed no versions', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        index: 'hello',
                    });

                    expect(templateName).toEqual('hello-v1_template');
                });
            });

            describe('when passed versions', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        index: 'hello',
                        version: 2,
                    });

                    expect(templateName).toEqual('hello-v2_template');
                });
            });

            describe('when passed an invalid config object', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-ignore
                        indexManager.formatTemplateName();
                    }).toThrowError('Invalid config passed to formatTemplateName');
                });
            });
        });

        describe('->getVersions', () => {
            describe('when passed nothing', () => {
                it('should return versions 1 and 1', () => {
                    // @ts-ignore
                    const versions = indexManager.getVersions();

                    expect(versions).toEqual({
                        dataVersion: 1,
                        schemaVersion: 1,
                    });
                });
            });

            describe('when passed an empty object', () => {
                it('should return versions 1 and 1', () => {
                    // @ts-ignore
                    const versions = indexManager.getVersions({ });

                    expect(versions).toEqual({
                        dataVersion: 1,
                        schemaVersion: 1,
                    });
                });
            });

            describe('when passed an valid config', () => {
                it('should be able to return default values', () => {
                    const versions = indexManager.getVersions({
                        indexSchema: {
                            mapping: {},
                            version: 1
                        },
                        version: 1,
                        index: 'hello'
                    });

                    expect(versions).toEqual({
                        dataVersion: 1,
                        schemaVersion: 1,
                    });
                });

                it('should be able to return non-default values', () => {
                    const versions = indexManager.getVersions({
                        indexSchema: {
                            mapping: {},
                            version: 777
                        },
                        version: 88,
                        index: 'hello'
                    });

                    expect(versions).toEqual({
                        dataVersion: 88,
                        schemaVersion: 777,
                    });
                });
            });

            describe('when passsed a invalid config', () => {
                it('should throw if a string is used for the Index Schema version', () => {
                    expect(() => {
                        indexManager.getVersions({
                            // @ts-ignore
                            indexSchema: {
                                mapping: {},
                                version: '8'
                            },
                            version: 8,
                            index: 'hello'
                        });
                    }).toThrowError('Index Version must a Integer, got "String"');
                });

                it('should throw if a negative integer is used for the Index Schema version', () => {
                    expect(() => {
                        indexManager.getVersions({
                            indexSchema: {
                                mapping: {},
                                version: -8
                            },
                            version: 8,
                            index: 'hello'
                        });
                    }).toThrowError('Index Version must be greater than 0, got "-8"');
                });

                it('should throw if a string is used for the Data Schema version', () => {
                    expect(() => {
                        indexManager.getVersions({
                            indexSchema: {
                                mapping: {},
                                version: 8
                            },
                            // @ts-ignore
                            version: '8',
                            index: 'hello'
                        });
                    }).toThrowError('Data Version must a Integer, got "String"');
                });

                it('should throw if a negative integer is used for the Data Schema version', () => {
                    expect(() => {
                        indexManager.getVersions({
                            indexSchema: {
                                mapping: {},
                                version: 8
                            },
                            version: -8,
                            index: 'hello'
                        });
                    }).toThrowError('Data Version must be greater than 0, got "-8"');
                });
            });
        });
    });
});
