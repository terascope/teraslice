import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    DataEntity,
    Slicer,
    Fetcher,
    BatchProcessor
} from '@terascope/job-components';
import { JobTestHarness } from '../src';

describe('JobTestHarness', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                }
            })
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
            assetDir: path.join(__dirname, 'fixtures'),
            clients,
        });

        it('should be able to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });

        it('should have a slicer', () => {
            expect(jobHarness.slicer()).toBeInstanceOf(Slicer);
        });

        it('should have fetcher', () => {
            expect(jobHarness.fetcher()).toBeInstanceOf(Fetcher);
        });

        it('should have on processor', () => {
            expect(jobHarness.processors).toBeArrayOfSize(1);
            expect(jobHarness.processors[0]).toBeInstanceOf(BatchProcessor);
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
