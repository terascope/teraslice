import 'jest-extended';
import {
    newTestJobConfig,
    newTestSlice,
    RunSliceResult,
    DataEntity,
} from '@terascope/job-components';
import { WorkerTestHarness } from '../src';

describe('WorkerTestHarness', () => {
    const clients = [
        {
            type: 'example',
            client: {
                say() {
                    return 'hello';
                }
            }
        }
    ];

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

        const jobHarness = new WorkerTestHarness(job, {
            assetDir: __dirname,
            clients
        });

        it('should be able to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });

        it('should be able to call runSlice', async () => {
            const result = await jobHarness.runSlice(newTestSlice()) as DataEntity[];
            expect(result).toBeArray();
        });

        it('should be able to call runSlice with fullResponse', async () => {
            const result = await jobHarness.runSlice(newTestSlice(), { fullResponse: true }) as RunSliceResult;
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });

        it('should be able to call shutdown', () => {
            return expect(jobHarness.shutdown()).resolves.toBeNil();
        });
    });
});
