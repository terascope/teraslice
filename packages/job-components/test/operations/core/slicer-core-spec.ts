import { newTestExecutionConfig, newTestSlice, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { SlicerCore, SliceResult } from '../../../src/operations/core/slicer-core';

describe('SlicerCore', () => {
    class ExampleSlicerCore extends SlicerCore {
        async handle(): Promise<boolean> {
            return false;
        }
    }

    let operation: ExampleSlicerCore;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        operation = new ExampleSlicerCore(context, opConfig, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => {
            return expect(operation.initialize([])).resolves.toBeUndefined();
        });
    });

    describe('->shutdown', () => {
        it('should resolve undefined', () => {
            return expect(operation.shutdown()).resolves.toBeUndefined();
        });
    });

    describe('->onSliceEnqueued', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceEnqueued(newTestSlice())).resolves.toBeUndefined();
        });
    });

    describe('->onSliceDispatch', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceDispatch(newTestSlice())).resolves.toBeUndefined();
        });
    });

    describe('->onSliceComplete', () => {
        it('should resolve undefined', () => {
            const result: SliceResult = {
                slice: newTestSlice(),
                analytics: {
                    time: [],
                    size: [],
                    memory: []
                }
            };
            return expect(operation.onSliceComplete(result)).resolves.toBeUndefined();
        });
    });
});
