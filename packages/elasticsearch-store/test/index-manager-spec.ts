import 'jest-extended';
import { TSError, debugLogger } from '@terascope/utils';
import { DataType } from '@terascope/data-types';
import { IndexManager, IndexConfig } from '../src';
import { makeClient } from './helpers/elasticsearch';

const dataType = new DataType({}, 'hello');

describe('IndexManager', () => {
    const client = makeClient();

    describe('when constructed with nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-expect-error
                new IndexManager();
            }).toThrowWithMessage(TSError, 'IndexManager requires elasticsearch client');
        });
    });

    describe('when constructed', () => {
        const indexManager = new IndexManager(client);

        describe('->_logger', () => {
            // eslint-disable-next-line
            const loggerFn = (config: Partial<IndexConfig<any>>) => {
                // @ts-expect-error
                return indexManager._logger(config);
            };

            describe('when a logger is configured', () => {
                const logger = debugLogger('hello');
                const config = {
                    name: 'hello-new',
                    logger,
                };

                it('should return the configured logger', () => {
                    expect(loggerFn(config)).toBe(logger);
                });
            });

            describe('when no logger is configured', () => {
                const config = {
                    name: 'hello-there',
                };

                const logger = loggerFn(config);

                it('should return a debug logger', () => {
                    expect(logger.debug).toBeFunction();
                    expect(logger.info).toBeFunction();
                    expect((logger as any).log).not.toBeFunction();
                    expect(logger.flush).toBeFunction();
                });

                it('should return the same logger if given the same config', () => {
                    expect(loggerFn(config)).toBe(logger);
                });

                it('should return the a different logger if given a different config', () => {
                    const newConfig = {
                        name: 'howdy-there',
                    };

                    expect(loggerFn(newConfig)).not.toBe(logger);
                });
            });
        });

        describe('->formatIndexName', () => {
            describe('when passed just a name', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        name: 'hello',
                        data_type: dataType,
                    });

                    expect(indexName).toEqual('hello-v1-s1');
                });
            });

            describe('when passed a name and a namespace', () => {
                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        name: 'hello',
                        namespace: 'test',
                        data_type: dataType,
                    });

                    expect(indexName).toEqual('test-hello-v1-s1');
                });
            });

            describe('when passed a timeseries config', () => {
                it('should return a correctly formatted index name if useWildCard is set to false', () => {
                    const indexName = indexManager.formatIndexName(
                        {
                            name: 'hello',
                            data_type: dataType,
                            index_schema: {
                                version: 1,
                                template: true,
                                timeseries: true,
                            },
                        },
                        false
                    );

                    const dateStr = new Date()
                        .toISOString()
                        .slice(0, 7)
                        .replace(/-/g, '.');
                    expect(indexName).toEqual(`hello-v1-s1-${dateStr}`);
                });

                it('should return a correctly formatted index name', () => {
                    const indexName = indexManager.formatIndexName({
                        name: 'hello',
                        data_type: dataType,
                        index_schema: {
                            version: 1,
                            template: true,
                            timeseries: true,
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
                        data_type: dataType,
                        index_schema: {
                            version: 2,
                        },
                    });

                    expect(indexName).toEqual('hello-v3-s2');
                });
            });
        });

        describe('->formatTemplateName', () => {
            describe('when passed just a name', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        name: 'hello',
                        data_type: dataType,
                    });

                    expect(templateName).toEqual('hello-v1');
                });
            });

            describe('when passed a name and a namespace', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        name: 'hello',
                        namespace: 'test',
                        data_type: dataType,
                    });

                    expect(templateName).toEqual('test-hello-v1');
                });
            });

            describe('when passed versions', () => {
                it('should return a correctly formatted template name', () => {
                    const templateName = indexManager.formatTemplateName({
                        name: 'hello',
                        version: 2,
                        data_type: dataType,
                    });

                    expect(templateName).toEqual('hello-v2');
                });
            });

            describe('when passed an invalid config object', () => {
                it('should throw an error', () => {
                    expect(() => {
                        // @ts-expect-error
                        indexManager.formatTemplateName();
                    }).toThrowWithMessage(TSError, 'IndexConfig cannot be empty');
                });
            });
        });
    });
});
