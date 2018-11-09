import 'jest-extended';
import { newTestJobConfig } from '@terascope/job-components';
import { JobHarness } from '../src';

describe('JobHarness', () => {
    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.operations = [
            {
                _op: 'hello',
            },
            {
                _op: 'there',
            }
        ];
        const jobHarness = new JobHarness(job);

        it('should be able to to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });
    });
});
