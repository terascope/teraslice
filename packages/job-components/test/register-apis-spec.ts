import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnyObject } from '@terascope/utils';
import {
    registerApis, OperationAPI, newTestJobConfig,
    TestContext, TestClientConfig, MetadataFns
} from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('registerApis', () => {
    const context = new TestContext('teraslice-operations');
    const { logger } = context;
    const assetDir = path.join(dirname, 'fixtures');
    context.sysconfig.teraslice.assets_directory = [assetDir];
    const jobConfig = newTestJobConfig();

    jobConfig.assets = ['asset'];

    jobConfig.operations.push({
        _op: 'hello',
    });

    jobConfig.operations.push({
        _op: 'hi',
    });

    registerApis(context, jobConfig);

    it('should have the correct apis', () => {
        expect(context.apis).toHaveProperty('op_runner');
        expect(context.apis.op_runner.getClient).toBeFunction();

        expect(context.apis).toHaveProperty('assets');
        expect(context.apis.assets.getPath).toBeFunction();

        expect(context.apis).toHaveProperty('job_runner');
        expect(context.apis.job_runner.getOpConfig).toBeFunction();

        expect(context.apis).toHaveProperty('executionContext');
        expect(context.apis.executionContext.addToRegistry).toBeFunction();
        expect(context.apis.executionContext.initAPI).toBeFunction();
        expect(context.apis.executionContext.getAPI).toBeFunction();
        expect(context.apis.executionContext.getMetadata).toBeFunction();
        expect(context.apis.executionContext.setMetadata).toBeFunction();
    });

    describe('->getOpConfig', () => {
        const { getOpConfig } = context.apis.job_runner;

        it('should return the given operation', () => {
            expect(getOpConfig('hello')).toEqual({
                _op: 'hello',
            });
        });

        it('should return undefined if not found', () => {
            expect(getOpConfig('unknown')).toBeUndefined();
        });
    });

    describe('->getPath', () => {
        const { getPath } = context.apis.assets;

        it('should return the given operation', () => {
            const assetPath = path.join(dirname, 'fixtures', 'asset');
            return expect(getPath('asset')).resolves.toEqual(assetPath);
        });

        it('should throw an error if asset is not found', () => expect(getPath('unknown')).rejects.toThrow('Unable to find asset "unknown"'));
    });

    describe('->getClient', () => {
        const { getClient } = context.apis.op_runner;

        const clients: TestClientConfig[] = [
            {
                type: 'elasticsearch-next',
                async createClient() {
                    return {
                        client: {
                            'elasticsearch-next': true,
                        },
                        logger
                    };
                },
            },
            {
                type: 'elasticsearch-next',
                endpoint: 'otherConnection',
                async createClient() {
                    return {
                        client: {
                            'elasticsearch-next': true,
                            endpoint: 'otherConnection',
                        },
                        logger
                    };
                },
            },
            {
                type: 'elasticsearch-next',
                endpoint: 'thirdConnection',
                async createClient() {
                    return {
                        client: {
                            'elasticsearch-next': true,
                            endpoint: 'thirdConnection',
                        },
                        logger
                    };
                },
            },
            {
                type: 'kafka',
                endpoint: 'someConnection',
                async createClient() {
                    return {
                        client: {
                            kafka: true,
                        },
                        logger
                    };
                },
            },
            {
                type: 'mongo',
                async createClient() {
                    return {
                        client: {
                            mongo: true,
                        },
                        logger
                    };
                },
            },
        ];

        context.apis.setTestClients(clients);

        it('getClient should return a client', async () => {
            await expect(getClient({}, 'elasticsearch-next')).resolves.toEqual({
                'elasticsearch-next': true,
            });

            const firstResult = await getClient(
                {
                    connection: 'otherConnection',
                    connection_cache: true,
                },
                'elasticsearch-next'
            );

            expect(firstResult).toEqual({
                'elasticsearch-next': true,
                endpoint: 'otherConnection',
            });

            await expect(
                getClient(
                    {
                        connection: 'otherConnection',
                        connection_cache: true,
                    },
                    'elasticsearch-next'
                )
            ).resolves.toBe(firstResult);

            await expect(
                getClient(
                    {
                        connection: 'thirdConnection',
                        connection_cache: false,
                    },
                    'elasticsearch-next'
                )
            ).resolves.toEqual({
                'elasticsearch-next': true,
                endpoint: 'thirdConnection',
            });

            await expect(
                getClient(
                    {
                        connection: 'someConnection',
                    },
                    'kafka'
                )
            ).resolves.toEqual({
                kafka: true,
            });

            await expect(
                getClient(
                    {
                        connection_cache: false,
                    },
                    'mongo'
                )
            ).resolves.toEqual({
                mongo: true,
            });
        });

        it('getClient will error properly', async () => {
            const failingContext = new TestContext('teraslice-operations');
            const failJobConfig = newTestJobConfig();

            jobConfig.operations.push({
                _op: 'hello',
            });

            jobConfig.operations.push({
                _op: 'hi',
            });

            registerApis(failingContext, failJobConfig);

            const err = new Error('a client error');
            const makeError = () => {
                throw err;
            };

            failingContext.apis.foundation.createClient = makeError;

            // @ts-expect-error
            await expect(() => failingContext.apis.op_runner.getClient()).rejects
                .toThrow(err);
        });
    });

    describe('->executionContext', () => {
        class HelloAPI extends OperationAPI {
            async createAPI() {
                return () => 'hello';
            }
        }

        type APIType = () => string;

        describe('->addToRegistry', () => {
            it('should succeed', () => {
                expect(() => {
                    context.apis.executionContext.addToRegistry('hello', HelloAPI);
                }).not.toThrow();
            });
        });

        describe('->initAPI', () => {
            it('should throw an error when the API is not in the registry', async () => {
                expect.hasAssertions();

                try {
                    await context.apis.executionContext.initAPI('uh-oh');
                } catch (err) {
                    expect(err.message).toEqual('Unable to find API by name "uh-oh"');
                }
            });

            it('should return the api and return hello when called', async () => {
                const result = await context.apis.executionContext.initAPI<APIType>('hello');
                expect(result()).toEqual('hello');
            });

            it('should not throw the API is already created', async () => {
                const result = await context.apis.executionContext.initAPI<APIType>('hello');
                expect(result()).toEqual('hello');
            });
        });

        describe('->getAPI', () => {
            it('should throw an error when the API is not found', () => {
                expect.hasAssertions();

                try {
                    context.apis.executionContext.getAPI('uh-oh');
                } catch (err) {
                    expect(err.message).toEqual('Unable to find API by name "uh-oh"');
                }
            });

            it('should return the api and return hello when called', () => {
                const result = context.apis.executionContext.getAPI<APIType>('hello');
                expect(result()).toEqual('hello');
            });
        });

        describe('->getMetadata/->setMetadata', () => {
            it('should be able to set and get the metadata', async () => {
                await context.apis.executionContext.setMetadata('hello', 'there');
                const result = await context.apis.executionContext.getMetadata();
                expect(result).toEqual({ hello: 'there' });
            });

            it('should throw if setting without a key', async () => {
                // @ts-expect-error its supposed to throw
                await expect(context.apis.executionContext.setMetadata(null)).toReject();
            });

            it('can register get and update apis', async () => {
                const data = { iAmTest: true };
                const testExId = 'testId';
                const metaData = { metadata: true };

                async function getApi(_exId?: string) {
                    return Object.assign({}, data);
                }

                async function updateApi(_exId: string, metadata: AnyObject) {
                    Object.assign({}, metadata);
                }

                const apis: MetadataFns = { get: getApi, update: updateApi };

                const getTestExpectations = await getApi();
                const updateTestExpectations = await updateApi(testExId, metaData);

                context.apis.executionContext.registerMetadataFns(apis);

                const getResults = await context.apis.executionContext.getMetadata();
                await context.apis.executionContext.setMetadata(testExId, metaData);

                expect(getResults).toEqual(getTestExpectations);
                expect(updateTestExpectations).toBeUndefined();
            });
        });
    });
});
