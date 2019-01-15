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
                            version: 'v1',
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
                            version: 'v1',
                            mapping: {},
                            template: true,
                            timeseries: true
                        },
                    });

                    expect(indexName).toEqual('hello-v1-s1*');
                });
            });

            describe('when passed valid versions', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                        version: 'v3.0.0',
                        indexSchema: {
                            version: 'v2.0.0',
                            mapping: {}
                        }
                    });

                    expect(indexName).toEqual('hello-v3-s2');
                });
            });

            describe('when passed versions without a v prefix', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                        version: '7.0.0',
                        indexSchema: {
                            version: '99.0.0',
                            mapping: {}
                        }
                    });

                    expect(indexName).toEqual('hello-v7-s99');
                });
            });

            describe('when passed versions with just a major number', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        index: 'hello',
                        version: '6',
                        indexSchema: {
                            version: '4',
                            mapping: {}
                        }
                    });

                    expect(indexName).toEqual('hello-v6-s4');
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
                        version: 'v2',
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
    });
});
