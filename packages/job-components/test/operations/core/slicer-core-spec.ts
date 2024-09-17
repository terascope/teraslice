import 'jest-extended';
import {
    newTestExecutionConfig, TestContext, Context,
    ExecutionContextAPI, OperationAPI, OpAPIFn
} from '../../../src/index.js';
import SlicerCore from '../../../src/operations/core/slicer-core.js';

describe('SlicerCore', () => {
    class ExampleSlicerCore extends SlicerCore {
        async handle(): Promise<boolean> {
            return false;
        }

        slicers() {
            return 1;
        }
    }

    class HelloAPI extends OperationAPI {
        async createAPI() {
            return () => 'hello';
        }
    }

    let slicer: ExampleSlicerCore;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        slicer = new ExampleSlicerCore(context as Context, opConfig, exConfig);

        const exContextApi = new ExecutionContextAPI(context, exConfig);
        exContextApi.addToRegistry('hello', HelloAPI);
        context.apis.registerAPI('executionContext', exContextApi);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => expect(slicer.initialize([])).resolves.toBeUndefined());
    });

    describe('->shutdown', () => {
        it('should resolves undefined', () => expect(slicer.shutdown()).resolves.toBeUndefined());
    });

    describe('->onSliceEnqueued', () => {
        it('should not have the method by default', () => {
            expect(slicer).not.toHaveProperty('onSliceEnqueued');
        });
    });

    describe('->onSliceDispatch', () => {
        it('should not have the method by default', () => {
            expect(slicer).not.toHaveProperty('onSliceDispatch');
        });
    });

    describe('->onSliceComplete', () => {
        it('should not have the method by default', () => {
            expect(slicer).not.toHaveProperty('onSliceComplete');
        });
    });

    describe('->onExecutionStats', () => {
        it('should updates stats', () => {
            const stats = {
                workers: {
                    connected: 1,
                    available: 1,
                },
                slices: {
                    processed: 1,
                    failed: 1,
                }
            };
            expect(slicer.onExecutionStats(stats)).toBeNil();
            expect(slicer).toHaveProperty('stats', stats);
        });
    });

    describe('->isRecoverable', () => {
        it('should return false', () => {
            expect(slicer.isRecoverable()).toBeFalse();
        });
    });

    describe('->maxQueueLength', () => {
        it('should return 10000', () => {
            expect(slicer.maxQueueLength()).toEqual(10000);
        });
    });

    describe('->createAPI', () => {
        it('should resolve the api', async () => {
            const api = await slicer.createAPI('hello') as OpAPIFn;
            return expect(api()).toEqual('hello');
        });
    });

    describe('->getAPI', () => {
        it('should resolve the api', () => {
            const api = slicer.getAPI('hello') as () => OpAPIFn;
            return expect(api()).toEqual('hello');
        });
    });
});
