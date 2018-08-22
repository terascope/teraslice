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
            it('should resolve an empty array', () => {
                return expect(operation.slice()).resolves.toBeArrayOfSize(0);
            });
        });
    });
});
