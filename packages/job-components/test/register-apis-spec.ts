import 'jest-extended'; // require for type definitions
import { registerApis, OperationAPI, newTestJobConfig, TestContext, TestClientConfig } from '../src';

describe('registerApis', () => {
    const context = new TestContext('teraslice-operations');
    const jobConfig = newTestJobConfig();

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
        expect(context.apis).toHaveProperty('job_runner');
        expect(context.apis.job_runner.getOpConfig).toBeFunction();
        expect(context.apis).toHaveProperty('executionContext');
        expect(context.apis.executionContext.addToRegistry).toBeFunction();
        expect(context.apis.executionContext.initAPI).toBeFunction();
        expect(context.apis.executionContext.getAPI).toBeFunction();
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

    describe('->getClient', () => {
        const { getClient } = context.apis.op_runner;

        const clients: TestClientConfig[] = [
            {
                type: 'elasticsearch',
                create() {
                    return {
                        client: {
                            elasticsearch: true
                        }
                    };
                }
            },
            {
                type: 'elasticsearch',
                endpoint: 'otherConnection',
                create() {
                    return {
                        client: {
                            elasticsearch: true,
                            endpoint: 'otherConnection'
                        }
                    };
                }
            },
            {
                type: 'elasticsearch',
                endpoint: 'thirdConnection',
                create() {
                    return {
                        client: {
                            elasticsearch: true,
                            endpoint: 'thirdConnection'
                        }
                    };
                }
            },
            {
                type: 'kafka',
                endpoint: 'someConnection',
                create() {
                    return {
                        client: {
                            kafka: true
                        }
                    };
                }
            },
            {
                type: 'mongo',
                create() {
                    return {
                        client: {
                            mongo: true
                        }
                    };
                }
            }
        ];

        context.apis.setTestClients(clients);

        it('getClient should return a client', () => {
            expect(getClient({}, 'elasticsearch')).toEqual({
                elasticsearch: true
            });

            const firstResult = getClient({
                connection: 'otherConnection',
                connection_cache: true
            }, 'elasticsearch');

            expect(firstResult).toEqual({
                elasticsearch: true,
                endpoint: 'otherConnection'
            });

            expect(getClient({
                connection: 'otherConnection',
                connection_cache: true
            }, 'elasticsearch')).toBe(firstResult);

            expect(getClient({
                connection: 'thirdConnection',
                connection_cache: false,
            }, 'elasticsearch')).toEqual({
                elasticsearch: true,
                endpoint: 'thirdConnection',
            });

            expect(getClient({
                connection: 'someConnection'
            }, 'kafka')).toEqual({
                kafka: true
            });

            expect(getClient({
                connection_cache: false
            }, 'mongo')).toEqual({
                mongo: true
            });
        });

        it('getClient will error properly', done => {
            const failingContext = new TestContext('teraslice-operations');
            const failJobConfig = newTestJobConfig();

            jobConfig.operations.push({
                _op: 'hello',
            });

            jobConfig.operations.push({
                _op: 'hi',
            });

            registerApis(failingContext, failJobConfig);
            const makeError = () => {
                throw new Error('a client error');
            };

            failingContext.foundation.getConnection = makeError;

            const events = failingContext.apis.foundation.getSystemEvents();
            const errStr =
                    'No configuration for endpoint default ' +
                    'was found in the terafoundation connectors';

            events.once('client:initialization:error', errMsg => {
                expect(errMsg.error.includes(errStr)).toEqual(true);
                done();
            });

            failingContext.apis.op_runner.getClient();
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

            it('should throw an error when the API is already created', async () => {
                expect.hasAssertions();

                try {
                    await context.apis.executionContext.initAPI('hello');
                } catch (err) {
                    expect(err.message).toEqual('API "hello" can only be initalized once');
                }
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
    });
});
