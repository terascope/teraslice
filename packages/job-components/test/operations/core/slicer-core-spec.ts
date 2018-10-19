import 'jest-extended'; // require for type definitions
import { newTestExecutionConfig, newTestSlice, TestContext, SliceResult, SlicerContext } from '../../../src';
import SlicerCore from '../../../src/operations/core/slicer-core';

describe('SlicerCore', () => {
    class ExampleSlicerCore extends SlicerCore {
        async handle(): Promise<boolean> {
            return false;
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
        it('should return undefined', () => {
            expect(slicer.onSliceEnqueued(newTestSlice())).toBeUndefined();
        });
    });

    describe('->onSliceDispatch', () => {
        it('should return undefined', () => {
            expect(slicer.onSliceDispatch(newTestSlice())).toBeUndefined();
        });
    });

    describe('->onSliceComplete', () => {
        it('should return undefined', () => {
            const result: SliceResult = {
                slice: newTestSlice(),
                analytics: {
                    time: [],
                    size: [],
                    memory: []
                }
            };
            expect(slicer.onSliceComplete(result)).toBeUndefined();
        });
    });
});
