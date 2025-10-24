import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    newTestJobConfig,
    Slicer,
    Fetcher,
    BatchProcessor,
    debugLogger,
    TestClientConfig
} from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';
import { JobTestHarness } from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('JobTestHarness', () => {
    const assetDir = path.join(dirname, 'fixtures');
    const logger = debugLogger('JobTestHarness');

    const clients: TestClientConfig[] = [
        {
            type: 'example',
            createClient: async () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                },
                logger
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
            assetDir: path.join(dirname, 'fixtures'),
            clients,
        });

        it('should be able to call initialize', () => expect(jobHarness.initialize()).resolves.toBeNil());

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

        it('should be able to call shutdown', () => expect(jobHarness.shutdown()).resolves.toBeNil());
    });

    describe('when running with parallel-slicers', () => {
        let jobHarness: JobTestHarness;

        afterEach(async () => {
            if (jobHarness) await jobHarness.shutdown();
        });

        async function makeTest(numOfSlicers = 1): Promise<JobTestHarness> {
            const job = newTestJobConfig();
            job.analytics = true;
            job.slicers = numOfSlicers;
            job.operations = [
                {
                    _op: 'parallel-reader',
                },
                {
                    _op: 'noop',
                }
            ];

            jobHarness = new JobTestHarness(job, {
                assetDir
            });

            await jobHarness.initialize();

            return jobHarness;
        }

        it('can run a single slicer to completion', async () => {
            const test = await makeTest();

            const results = await test.runToCompletion();

            results.forEach((obj, index) => {
                expect(obj.slice.slicer_id).toEqual(0);
                expect(obj.slice.slicer_order).toEqual(index + 1);

                expect(obj.data).toBeArrayOfSize(1);
                expect(obj.data).toEqual([{ count: 2 - index, id: 0 }]);
            });
        });

        it('can run two slicers to completion', async () => {
            const test = await makeTest(2);

            const results = await test.runToCompletion();
            const slicerOne = results.filter((obj) => obj.slice.slicer_id === 0);
            const slicerTwo = results.filter((obj) => obj.slice.slicer_id === 1);

            slicerOne.forEach((obj, index) => {
                expect(obj.slice.slicer_id).toEqual(0);
                expect(obj.slice.slicer_order).toEqual(index + 1);

                expect(obj.data).toBeArrayOfSize(1);
                expect(obj.data).toEqual([{ count: 2 - index, id: 0 }]);
            });

            slicerTwo.forEach((obj, index) => {
                expect(obj.slice.slicer_id).toEqual(1);
                expect(obj.slice.slicer_order).toEqual(index + 1);

                expect(obj.data).toBeArrayOfSize(1);
                expect(obj.data).toEqual([{ count: 2 - index, id: 1 }]);
            });
        });
    });
});
