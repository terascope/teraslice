import 'jest-extended';
import { jest } from '@jest/globals';
import OperationCore from '../../../src/operations/core/operation-core.js';
import {
    OperationAPI, ExecutionContextAPI, OpAPIFn,
    TestContext, Context, newTestExecutionConfig
} from '../../../src/index.js';

describe('OperationCore', () => {
    class HelloAPI extends OperationAPI {
        async createAPI() {
            return () => 'hello';
        }
    }

    let operation: OperationCore;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        const exContextApi = new ExecutionContextAPI(context, exConfig);
        exContextApi.addToRegistry('hello', HelloAPI);
        context.apis.registerAPI('executionContext', exContextApi);

        operation = new OperationCore(context as Context, opConfig, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => expect(operation.initialize()).resolves.toBeUndefined());
    });

    describe('->shutdown', () => {
        it('should resolve undefined', () => expect(operation.shutdown()).resolves.toBeUndefined());
    });

    describe('->onSliceInitialized', () => {
        it('should not have the method by default', () => {
            expect(operation).not.toHaveProperty('onSliceInitialized');
        });
    });

    describe('->onSliceStarted', () => {
        it('should not have the method by default', () => {
            expect(operation).not.toHaveProperty('onSliceStarted');
        });
    });

    describe('->onSliceFinalizing', () => {
        it('should not have the method by default', () => {
            expect(operation).not.toHaveProperty('onSliceFinalizing');
        });
    });

    describe('->onSliceFinished', () => {
        it('should not have the method by default', () => {
            expect(operation).not.toHaveProperty('onSliceFinished');
        });
    });

    describe('->onSliceFailed', () => {
        it('should not have the method by default', () => {
            expect(operation).not.toHaveProperty('onSliceFailed');
        });
    });

    describe('->onSliceRetry', () => {
        it('should not have the method by default', () => {
            expect(operation).not.toHaveProperty('onSliceRetry');
        });
    });

    describe('->createAPI', () => {
        it('should resolve the api', async () => {
            const api = await operation.createAPI('hello') as OpAPIFn;
            return expect(api()).toEqual('hello');
        });
    });

    describe('->getAPI', () => {
        it('should resolve the api', () => {
            const api = operation.getAPI('hello') as () => OpAPIFn;
            return expect(api()).toEqual('hello');
        });
    });

    describe('->rejectRecord', () => {
        const record = Buffer.from('hello');
        const err = new Error('Bad news bears');

        describe('when the action is log', () => {
            let ogError: any;

            beforeAll(() => {
                ogError = operation.logger.error;
                operation.deadLetterAction = 'log';
                // @ts-expect-error
                operation.logger.error = jest.fn();
            });

            afterAll(() => {
                operation.logger.error = ogError;
            });

            it('should log the record', () => {
                const result = operation.rejectRecord(record, err);
                expect(operation.logger.error).toHaveBeenCalledWith(err, 'Bad record', record);
                expect(result).toBeNull();
            });
        });

        describe('when the action is throw', () => {
            beforeAll(() => {
                operation.deadLetterAction = 'throw';
            });

            it('should throw the original error', () => {
                expect(() => {
                    operation.rejectRecord(record, err);
                }).toThrow('Bad news bears');
            });
        });

        describe('when the action is example', () => {
            const deadLetterAPI = jest.fn();

            class ExampleDeadLetterAPI extends OperationAPI {
                async createAPI() {
                    return deadLetterAPI;
                }
            }

            beforeAll(() => {
                operation.deadLetterAction = 'example';
                operation.context.apis.executionContext.addToRegistry('example', ExampleDeadLetterAPI);
                operation.createAPI('example');
            });

            it('should call the dead letter queue API with the record and err', () => {
                const result = operation.rejectRecord(record, err);
                expect(result).toBeNull();

                expect(deadLetterAPI).toHaveBeenCalledWith(record, err);
            });
        });

        describe('when the action is not registered', () => {
            beforeAll(() => {
                operation.deadLetterAction = 'thiswontwork';
            });

            it('should throw an error', () => {
                expect(() => {
                    operation.rejectRecord(record, err);
                }).toThrow('Unable to find API by name "thiswontwork"');
            });
        });

        describe('when the action is none', () => {
            beforeAll(() => {
                operation.deadLetterAction = 'none';
            });

            it('should return null', () => {
                const result = operation.rejectRecord(record, err);
                expect(result).toBeNull();
            });
        });
    });

    describe('->tryRecord', () => {
        const record = Buffer.from('hello');
        const err = new Error('Bad news bears');

        let ogReject: any;
        beforeEach(() => {
            ogReject = operation.rejectRecord;
            // @ts-expect-error
            operation.rejectRecord = jest.fn();
        });

        afterEach(() => {
            operation.rejectRecord = ogReject;
        });

        describe('when the fn fails', () => {
            it('should call operation.rejectRecord', () => {
                const fn = operation.tryRecord(() => {
                    throw err;
                });

                const result = fn(record);
                expect(operation.rejectRecord).toHaveBeenCalledWith(record, err);
                expect(result).toBeNull();
            });
        });

        describe('when the fn succceds', () => {
            it('should not call operation.rejectRecord', () => {
                const fn = operation.tryRecord(() => ({ hello: true }));

                const result = fn(record);
                expect(operation.rejectRecord).not.toHaveBeenCalled();
                expect(result).toEqual({ hello: true });
            });
        });
    });
});
