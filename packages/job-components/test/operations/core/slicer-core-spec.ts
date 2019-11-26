import 'jest-extended'; // require for type definitions
import { newTestExecutionConfig, TestContext, WorkerContext } from '../../../src';
import SlicerCore from '../../../src/operations/core/slicer-core';

describe('SlicerCore', () => {
    class ExampleSlicerCore extends SlicerCore {
        async handle(): Promise<boolean> {
            return false;
        }

        slicers() {
            return 1;
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
        slicer = new ExampleSlicerCore(context as WorkerContext, opConfig, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => expect(slicer.initialize([])).resolves.toBeUndefined());

        it('should throw if slicer is not recoverable but given recoveryData', async () => {
            expect.hasAssertions();
            const errMsg = 'cannot provide recovery data to a slicer that is not recoverable. Please create the isRecoverable method and have it return true if recovery is desired';
            try {
                await slicer.initialize([
                    {
                        lastSlice: {
                            slice_id: 'someId',
                            slicer_id: 0,
                            slicer_order: 34,
                            _created: 'someTime',
                            request: { some: 'data' },
                        }
                    }
                ]);
            } catch (err) {
                expect(err.message).toEqual(errMsg);
            }
        });
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
});
