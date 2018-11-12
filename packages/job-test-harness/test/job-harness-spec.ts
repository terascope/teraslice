import 'jest-extended';
import { newTestJobConfig, Assignment, newTestSlice } from '@terascope/job-components';
import { JobHarness } from '../src';

describe('JobHarness', () => {
    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.analytics = true;
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

        it('should be able to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });

        it('should be able to call runSlice', async () => {
            const result = await jobHarness.runSlice(newTestSlice());
            if (result == null) {
                expect(result).not.toBeNil();
                return;
            }
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });

        it('should not be able to call createSlices', () => {
            const errorMsg = 'createSlices can only be run with assignment of "execution_controller"';
            return expect(jobHarness.createSlices()).rejects.toThrowError(errorMsg);
        });

        it('should be able to call cleanup', () => {
            return expect(jobHarness.cleanup()).resolves.toBeNil();
        });
    });
});
