import 'jest-extended'; // require for type definitions
import { TestContext, newTestExecutionConfig } from '@terascope/teraslice-types';
import APICore from '../../../src/operations/core/api-core';

describe('APICore', () => {
    class ExampleAPI extends APICore {}

    let api: ExampleAPI;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        api = new ExampleAPI(context, exConfig);
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
