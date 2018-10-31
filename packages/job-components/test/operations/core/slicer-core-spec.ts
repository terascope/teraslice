import 'jest-extended'; // require for type definitions
import { newTestExecutionConfig, TestContext, SlicerContext } from '../../../src';
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
        slicer = new ExampleSlicerCore(context as SlicerContext, opConfig, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => {
            return expect(slicer.initialize([])).resolves.toBeUndefined();
        });
    });

    describe('->shutdown', () => {
        it('should resolves undefined', () => {
            return expect(slicer.shutdown()).resolves.toBeUndefined();
        });
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
