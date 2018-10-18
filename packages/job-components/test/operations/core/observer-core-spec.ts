import 'jest-extended'; // require for type definitions
import { TestContext, newTestExecutionConfig, WorkerContext } from '../../../src';
import ObserverCore from '../../../src/operations/core/observer-core';

describe('ObserverCore', () => {
    class ExampleObserver extends ObserverCore {}

    let api: ExampleObserver;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        api = new ExampleObserver(context as WorkerContext, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => {
            return expect(api.initialize()).resolves.toBeUndefined();
        });
    });

    describe('->shutdown', () => {
        it('should resolve undefined', () => {
            return expect(api.shutdown()).resolves.toBeUndefined();
        });
    });

    describe('->onSliceInitialized', () => {
        it('should resolve undefined', () => {
            return expect(api.onSliceInitialized('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceStarted', () => {
        it('should resolve undefined', () => {
            return expect(api.onSliceStarted('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceFinalizing', () => {
        it('should resolve undefined', () => {
            return expect(api.onSliceFinalizing('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceFinished', () => {
        it('should resolve undefined', () => {
            return expect(api.onSliceFinished('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceFailed', () => {
        it('should resolve undefined', () => {
            return expect(api.onSliceFailed('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceRetry', () => {
        it('should resolve undefined', () => {
            return expect(api.onSliceRetry('slice-id')).resolves.toBeUndefined();
        });
    });
});
