import 'jest-extended'; // require for type definitions
import { TestContext, newTestExecutionConfig } from '@terascope/teraslice-types';
import { OperationAPI, ExecutionContextAPI, OpAPIFn } from '../../../src';
import OperationCore from '../../../src/operations/core/operation-core';

describe('OperationCore', () => {
    class HelloAPI extends OperationAPI {
        async createAPI() {
            return () => 'hello';
        }
    }

    let operation: OperationCore;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        const exContextApi = new ExecutionContextAPI(context, exConfig);
        exContextApi.addToRegistry('hello', HelloAPI);
        context.apis.registerAPI('executionContext', exContextApi);

        operation = new OperationCore(context, opConfig, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => {
            return expect(operation.initialize()).resolves.toBeUndefined();
        });
    });

    describe('->shutdown', () => {
        it('should resolve undefined', () => {
            return expect(operation.shutdown()).resolves.toBeUndefined();
        });
    });

    describe('->onSliceInitialized', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceInitialized('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceStarted', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceStarted('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceFinalizing', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceFinalizing('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceFinished', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceFinished('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceFailed', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceFailed('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->onSliceRetry', () => {
        it('should resolve undefined', () => {
            return expect(operation.onSliceRetry('slice-id')).resolves.toBeUndefined();
        });
    });

    describe('->createAPI', () => {
        it('should resolve the api', async () => {
            const api = await operation.createAPI('hello') as OpAPIFn;
            return expect(api()).toEqual('hello');
        });
    });

    describe('->getAPI', () => {
        it('should resolve the api', () => {
            const api = operation.getAPI('hello') as () => OpAPIFn;
            return expect(api()).toEqual('hello');
        });
    });
});
