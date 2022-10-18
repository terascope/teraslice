import 'jest-extended'; // require for type definitions
import { times } from '@terascope/utils';
import {
    EachProcessor,
    legacySliceEventsShim,
    DataEntity,
    TestContext,
    WorkerContext,
    newTestExecutionConfig
} from '../../../src/index.js';

describe('Legacy Slice Events Shim', () => {
    const workerShutdown = jest.fn();
    const sliceEvents = {
        'slice:initialize': jest.fn(),
        'slice:retry': jest.fn(),
        'slice:failure': jest.fn(),
        'slice:success': jest.fn(),
        'slice:finalize': jest.fn(),
    };

    class ExampleOp<T = Record<string, any>> extends EachProcessor<T> {
        forEach(_data: DataEntity) {}

        async shutdown(): Promise<void> {
            workerShutdown();
        }

        async onSliceInitialized(sliceId: string) {
            sliceEvents['slice:initialize'](sliceId);
        }

        async onSliceRetry(sliceId: string) {
            sliceEvents['slice:retry'](sliceId);
        }

        async onSliceFailed(sliceId: string) {
            sliceEvents['slice:failure'](sliceId);
        }

        async onSliceFinalizing(sliceId: string) {
            sliceEvents['slice:success'](sliceId);
        }

        async onSliceFinished(sliceId: string) {
            sliceEvents['slice:finalize'](sliceId);
        }
    }

    const exConfig = newTestExecutionConfig();
    exConfig.operations.push({
        _op: 'example'
    });

    const opConfig = exConfig.operations[0];

    const context = new TestContext('legacy-processor');

    const processor = new ExampleOp(context as WorkerContext, opConfig, exConfig);
    legacySliceEventsShim(processor);
    const timesCalled = 2;

    beforeAll((done) => {
        times(timesCalled, () => {
            processor.events.emit('worker:shutdown');
            Object.keys(sliceEvents).forEach((eventName: string) => {
                processor.events.emit(eventName, {
                    slice_id: 'some-slice-id'
                });
            });
        });

        setTimeout(() => {
            done();
        }, 100);
    });

    it('should call shutdown once', () => {
        expect(workerShutdown).toHaveBeenCalledTimes(1);
    });

    it('should handle the slice events correctly', () => {
        Object.values(sliceEvents).forEach((mock) => {
            expect(mock).toHaveBeenCalledWith('some-slice-id');
            expect(mock).toHaveBeenCalledTimes(timesCalled);
        });
    });
});
