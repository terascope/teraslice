import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import { Operation } from '../src/operation';

describe('Operation', () => {
    describe('when constructed', () => {
        let operation : Operation;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const jobConfig = newTestJobConfig()
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            operation = new Operation(context, jobConfig, opConfig);
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
    });

    describe('#validate', () => {
        it('should fail when given invalid data', () => {
            Operation.validate({
                _op: 'hello',
            });
        });
    });
});
