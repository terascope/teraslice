import 'jest-extended'; // require for type definitions
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    registerApis,
    OperationAPI,
    newTestJobConfig,
    TestContext,
    TestClientConfig,
    AnyObject
} from '../src';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('registerApis', () => {
    const context = new TestContext('teraslice-operations');
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

        it('should throw an error if asset is not found', () => expect(getPath('unknown')).rejects.toThrowError('Unable to find asset "unknown"'));
    });

    describe('->getClient', () => {
        const { getClient } = context.apis.op_runner;

        const clients: TestClientConfig[] = [
            {
                type: 'elasticsearch-next',
                create() {
                    return {
                        client: {
                            'elasticsearch-next': true,
                        },
                    };
                },
            },
            {
                type: 'elasticsearch-next',
                endpoint: 'otherConnection',
                create() {
                    return {
                        client: {
                            'elasticsearch-next': true,
                            endpoint: 'otherConnection',
                        },
                    };
                },
            },
            {
                type: 'elasticsearch-next',
                endpoint: 'thirdConnection',
                create() {
                    return {
                        client: {
                            'elasticsearch-next': true,
                            endpoint: 'thirdConnection',
                        },
                    };
                },
            },
            {
                type: 'kafka',
                endpoint: 'someConnection',
                create() {
                    return {
                        client: {
                            kafka: true,
                        },
                    };
                },
            },
            {
                type: 'mongo',
                create() {
                    return {
                        client: {
                            mongo: true,
                        },
                    };
                },
            },
        ];

        context.apis.setTestClients(clients);

        it('getClient should return a client', () => {
            expect(getClient({}, 'elasticsearch-next')).toEqual({
                'elasticsearch-next': true,
            });

            const firstResult = getClient(
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

            expect(
                getClient(
                    {
                        connection: 'otherConnection',
                        connection_cache: true,
                    },
                    'elasticsearch-next'
                )
            ).toBe(firstResult);

            expect(
                getClient(
                    {
                        connection: 'thirdConnection',
                        connection_cache: false,
                    },
                    'elasticsearch-next'
                )
            ).toEqual({
                'elasticsearch-next': true,
                endpoint: 'thirdConnection',
            });

            expect(
                getClient(
                    {
                        connection: 'someConnection',
                    },
                    'kafka'
                )
            ).toEqual({
                kafka: true,
            });

            expect(
                getClient(
                    {
                        connection_cache: false,
                    },
                    'mongo'
                )
            ).toEqual({
                mongo: true,
            });
        });

        it('getClient will error properly', () => {
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

            failingContext.foundation.getConnection = makeError;

            expect(() => failingContext.apis.op_runner.getClient())
                .toThrowError(err);
        });

        it('getClientAsync will return an async client', async () => {
            const { getClientAsync } = context.apis.op_runner;

            const results = await getClientAsync(
                {
                    connection: 'default',
                    connection_cache: true,
                },
                'elasticsearch-next'
            );

            expect(results).toEqual({
                'elasticsearch-next': true,
            });
        });
    });

    describe('->executionContext', () => {
        class HelloAPI extends OperationAPI {
            async createAPI() {
                return () => 'hello';
            }
        }

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
                const result = await context.apis.executionContext.initAPI('hello');
                expect(result()).toEqual('hello');
            });

            it('should not throw the API is already created', async () => {
                const result = await context.apis.executionContext.initAPI('hello');
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
                const result = context.apis.executionContext.getAPI('hello');
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
                    return Object.assign({}, metadata);
                }

                const apis = { get: getApi, update: updateApi };

                const getTestExpectations = await getApi();
                const updateTestExpectations = await updateApi(testExId, metaData);

                context.apis.executionContext.registerMetadataFns(apis);

                const getResults = await context.apis.executionContext.getMetadata();
                await context.apis.executionContext.setMetadata(testExId, metaData);

                expect(getResults).toEqual(getTestExpectations);
                expect(metaData).toEqual(updateTestExpectations);
            });
        });
    });
});
