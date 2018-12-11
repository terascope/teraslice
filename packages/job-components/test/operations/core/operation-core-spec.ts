import 'jest-extended'; // require for type definitions
import OperationCore from '../../../src/operations/core/operation-core';
import {
    OperationAPI,
    ExecutionContextAPI,
    OpAPIFn,
    TestContext,
    WorkerContext,
    newTestExecutionConfig
} from '../../../src';

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

        operation = new OperationCore(context as WorkerContext, opConfig, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => {
            return expect(operation.initialize()).resolves.toBeUndefined();
        });
    });

    describe('->shutdown', () => {
        it('should resolve undefined', () => {
            return expect(operation.shutdown()).resolves.toBeUndefined();
        });
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
                operation.logger.error = jest.fn();
            });

            afterAll(() => {
                operation.logger.error = ogError;
            });

            it('should log the record', () => {
                const result = operation.rejectRecord(record, err);
                expect(operation.logger.error).toHaveBeenCalledWith('Bad record', record, err);
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
                }).toThrowError('Bad news bears');
            });
        });

        describe('when the action is custom', () => {
            beforeAll(() => {
                operation.deadLetterAction = 'custom';
            });

            it('should throw until we implement this (TODO)', () => {
                expect(() => {
                    operation.rejectRecord(record, err);
                }).toThrowError('Custom dead letter queues are not suppported yet');
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

        let ogReject : any;
        beforeEach(() => {
            ogReject = operation.rejectRecord;
            operation.rejectRecord = jest.fn();
        });

        afterEach(() => {
            operation.rejectRecord = ogReject;
        });

        describe('when the fn fails', () => {
            it('should call operation.rejectRecord', () => {
                const result = operation.tryRecord(record, () => {
                    throw err;
                });
                expect(operation.rejectRecord).toHaveBeenCalledWith(record, err);
                expect(result).toBeNull();
            });
        });

        describe('when the fn succceds', () => {
            it('should not call operation.rejectRecord', () => {
                const result = operation.tryRecord(record, () => {
                    return { hello: true };
                });
                expect(operation.rejectRecord).not.toHaveBeenCalled();
                expect(result).toEqual({ hello: true });
            });
        });
    });
});
