import 'jest-extended'; // require for type definitions
import times from 'lodash/times';
import {
    EachProcessor,
    legacySliceEventsShim,
    DataEntity,
    TestContext,
    newTestExecutionConfig
} from '../../../src';

describe('Legacy Slice Events Shim', () => {
    const workerShutdown = jest.fn();
    const sliceEvents = {
        'slice:initialize': jest.fn(),
        'slice:retry': jest.fn(),
        'slice:failure': jest.fn(),
        'slice:success': jest.fn(),
        'slice:finalize': jest.fn(),
    };

    class ExampleOp extends EachProcessor {
        forEach(data: DataEntity) {
            if (data) {
                return;
            }

            return;
        }

        async shutdown() {
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

    const processor = new ExampleOp(context, opConfig, exConfig);
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
