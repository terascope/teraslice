import 'jest-extended'; // require for type definitions
import path from 'path';
import {
    registerApis,
    OperationAPI,
    newTestJobConfig,
    TestContext,
    TestClientConfig
} from '../src';

describe('registerApis', () => {
    const context = new TestContext('teraslice-operations');
    context.sysconfig.teraslice.assets_directory = __dirname;
    const jobConfig = newTestJobConfig();

    jobConfig.assets = ['fixtures'];

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
            const assetPath = path.join(__dirname, 'fixtures');
            return expect(getPath('fixtures')).resolves.toEqual(assetPath);
        });

        it('should throw an error if asset is not found', () => expect(getPath('unknown')).rejects.toThrowError('Unable to find asset "unknown"'));
    });

    describe('->getClient', () => {
        const { getClient } = context.apis.op_runner;

        const clients: TestClientConfig[] = [
            {
                type: 'elasticsearch',
                create() {
                    return {
                        client: {
                            elasticsearch: true,
                        },
                    };
                },
            },
            {
                type: 'elasticsearch',
                endpoint: 'otherConnection',
                create() {
                    return {
                        client: {
                            elasticsearch: true,
                            endpoint: 'otherConnection',
                        },
                    };
                },
            },
            {
                type: 'elasticsearch',
                endpoint: 'thirdConnection',
                create() {
                    return {
                        client: {
                            elasticsearch: true,
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
            expect(getClient({}, 'elasticsearch')).toEqual({
                elasticsearch: true,
            });

            const firstResult = getClient(
                {
                    connection: 'otherConnection',
                    connection_cache: true,
                },
                'elasticsearch'
            );

            expect(firstResult).toEqual({
                elasticsearch: true,
                endpoint: 'otherConnection',
            });

            expect(
                getClient(
                    {
                        connection: 'otherConnection',
                        connection_cache: true,
                    },
                    'elasticsearch'
                )
            ).toBe(firstResult);

            expect(
                getClient(
                    {
                        connection: 'thirdConnection',
                        connection_cache: false,
                    },
                    'elasticsearch'
                )
            ).toEqual({
                elasticsearch: true,
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
        });
    });
});
