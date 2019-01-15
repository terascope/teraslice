import 'jest-extended';
import es from 'elasticsearch';
import { TSError } from '@terascope/utils';
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
            }).toThrowWithMessage(TSError, 'IndexManager requires elasticsearch client');
        });
    });

    describe('when constructed', () => {
        const indexManager = new IndexManager(client);

        describe('->formatIndexName', () => {
            describe('when passed no versions', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        name: 'hello',
                    });

                    expect(indexName).toEqual('hello-v1-s1');
                });
            });

            describe('when passed a timeseries config', () => {
                it('should return a correctly formatted index name if useWildCard is set to false', () => {
                    const indexName = indexManager.formatIndexName({
                        name: 'hello',
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
                        name: 'hello',
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
                        name: 'hello',
                        version: 3,
                        indexSchema: {
                            version: 2,
                            mapping: {}
                        }
                    });

                    expect(indexName).toEqual('hello-v3-s2');
                });
            });

        });

        describe('->formatTemplateName', () => {
            describe('when passed no versions', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        name: 'hello',
                    });

                    expect(templateName).toEqual('hello-v1');
                });
            });

            describe('when passed versions', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        name: 'hello',
                        version: 2,
                    });

                    expect(templateName).toEqual('hello-v2');
                });
            });

            describe('when passed an invalid config object', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-ignore
                        indexManager.formatTemplateName();
                    }).toThrowWithMessage(TSError, 'IndexConfig cannot be empty');
                });
            });
        });

        describe('->getVersions', () => {
            describe('when passed an valid config', () => {
                it('should be able to return default values', () => {
                    const versions = indexManager.getVersions({
                        indexSchema: {
                            mapping: {},
                            version: 1
                        },
                        version: 1,
                        name: 'hello'
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
                        name: 'hello'
                    });

                    expect(versions).toEqual({
                        dataVersion: 88,
                        schemaVersion: 777,
                    });
                });
            });
        });
    });
});
