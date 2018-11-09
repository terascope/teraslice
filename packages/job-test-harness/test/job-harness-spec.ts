import 'jest-extended';
import { newTestJobConfig, Assignment } from '@terascope/job-components';
import { JobHarness } from '../src';

describe('JobHarness', () => {
    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.operations = [
            {
                _op: 'test-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const jobHarness = new JobHarness(job, {
            assignment: Assignment.Worker,
            assetDir: __dirname,
        });

        it('should be able to to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });
    });
});
