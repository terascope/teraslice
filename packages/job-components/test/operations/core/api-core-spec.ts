import 'jest-extended'; // require for type definitions
import { TestContext, newTestExecutionConfig, WorkerContext } from '../../../src';
import APICore from '../../../src/operations/core/api-core';

describe('APICore', () => {
    class ExampleAPI extends APICore {}

    let api: ExampleAPI;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        api = new ExampleAPI(context as WorkerContext, exConfig);
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
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceInitialized');
        });
    });

    describe('->onSliceStarted', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceStarted');
        });
    });

    describe('->onSliceFinalizing', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceFinalizing');
        });
    });

    describe('->onSliceFinished', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceFinished');
        });
    });

    describe('->onSliceFailed', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceFailed');
        });
    });

    describe('->onSliceRetry', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceRetry');
        });
    });

});
