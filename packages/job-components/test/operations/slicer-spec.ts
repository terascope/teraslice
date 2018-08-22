import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { Slicer } from '../../src';

describe('Slicer Operation Base Class', () => {
    describe('when constructed', () => {
        let operation: Slicer;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const jobConfig = newTestJobConfig();
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            const logger = context.apis.foundation.makeLogger('job-logger');
            operation = new Slicer(context, jobConfig, opConfig, logger);
        });

        describe('->slice', () => {
            it('should reject with an implementation warning', () => {
                return expect(operation.slice()).rejects.toThrowError('Slicer must implement a "slice" method');
            });
        });
    });

    describe('when extending the base class', () => {
        class ExampleSlicer extends Slicer {
            public async slice(): Promise<object[] | null> {
                return [
                   { hi: true }
                ];
            }
        }

        let operation: ExampleSlicer;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const jobConfig = newTestJobConfig();
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            const logger = context.apis.foundation.makeLogger('job-logger');
            operation = new ExampleSlicer(context, jobConfig, opConfig, logger);
        });

        describe('->slice', () => {
            it('should resolve with data entries', () => {
                return expect(operation.slice()).resolves.toBeArrayOfSize(1);
            });
        });
    });
});
