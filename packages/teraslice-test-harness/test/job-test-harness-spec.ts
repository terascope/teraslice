import 'jest-extended';
import { newTestJobConfig, DataEntity } from '@terascope/job-components';
import { JobTestHarness } from '../src';

describe('JobTestHarness', () => {
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

        const jobHarness = new JobTestHarness(job, {
            assetDir: __dirname,
            clients,
        });

        it('should be able to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });

        it('should be able to call run', async () => {
            const results = await jobHarness.run();
            expect(results).toBeArray();
            expect(results[0]).toBeArray();

            expect(DataEntity.isDataEntityArray(results[0])).toBeTrue();
        });

        it('should be able to call shutdown', () => {
            return expect(jobHarness.shutdown()).resolves.toBeNil();
        });
    });
});
