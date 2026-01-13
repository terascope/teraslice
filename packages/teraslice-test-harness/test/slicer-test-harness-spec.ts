import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    newTestJobConfig, Slicer, LifeCycle,
    TestClientConfig, ValidatedJobConfig
} from '@terascope/job-components';
import { uniq, debugLogger } from '@terascope/core-utils';
import { SlicerTestHarness } from '../src/index.js';
import ParallelSlicer from './fixtures/asset/parallel-reader/slicer.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SlicerTestHarness', () => {
    const assetDir = path.join(dirname, 'fixtures');
    const logger = debugLogger('SlicerTestHarness');

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
        let job: ValidatedJobConfig;
        let slicerHarness: SlicerTestHarness;

        beforeEach(async () => {
            job = newTestJobConfig();
            job.analytics = true;
            job.operations = [
                {
                    _op: 'test-reader',
                },
                {
                    _op: 'noop',
                }
            ];
            slicerHarness = new SlicerTestHarness(job, {
                assetDir: path.join(dirname, 'fixtures'),
                clients,
            });

            await slicerHarness.initialize();
        });

        afterEach(async () => {
            await slicerHarness.shutdown();
        });

        it('should be able to call initialize', () => expect(slicerHarness.initialize).toBeFunction());

        it('should throw if given recoveryData since slicer is not recoverable', async () => {
            expect.assertions(1);
            const lastSlice = { some: 'stuff' };

            try {
                await slicerHarness.initialize([{
                    lastSlice,
                    slicer_id: 0,
                }]);
            } catch (err) {
                expect(err).toBeDefined();
            }
        });

        it('should have a slicer', async () => {
            await slicerHarness.initialize();
            expect(slicerHarness.slicer()).toBeInstanceOf(Slicer);
        });

        it('should be able to call createSlices', async () => {
            await slicerHarness.initialize();

            const result = await slicerHarness.createSlices();

            expect(result).toBeArray();

            expect(result[0]).not.toHaveProperty('slice_id');
            expect(result[0]).not.toHaveProperty('slicer_id');
            expect(result[0]).not.toHaveProperty('slicer_order');
        });

        it('should be able to call createSlices with fullResponse', async () => {
            const result = await slicerHarness.createSlices({ fullResponse: true });
            expect(result).toBeArray();
            expect(result[0]).toHaveProperty('slice_id');
            expect(result[0]).toHaveProperty('slicer_id');
            expect(result[0]).toHaveProperty('slicer_order');
        });

        it('should be able to call shutdown', () => expect(slicerHarness.shutdown()).resolves.toBeNil());

        it('should not throw if shutdown is called before initialized', async () => {
            let test: SlicerTestHarness;

            try {
                test = new SlicerTestHarness(job, {
                    assetDir: path.join(dirname, 'fixtures'),
                    clients,
                });

                await expect(test.shutdown()).resolves.not.toThrow();
            } finally {
                // @ts-expect-error
                if (test) {
                    await test.shutdown();
                }
            }
        });
    });

    describe('when given a slicer that is recoverable', () => {
        let slicerHarness: SlicerTestHarness;
        let job: ValidatedJobConfig;

        const lastSlice = {
            count: 25
        };

        beforeEach(() => {
            job = newTestJobConfig();
            job.analytics = true;
            job.operations = [
                {
                    _op: 'recoverable-reader',
                },
                {
                    _op: 'noop',
                }
            ];

            slicerHarness = new SlicerTestHarness(job, {
                assetDir
            });
        });

        afterEach(async () => {
            await slicerHarness.shutdown();
        });

        it('should not throw if given recovery data', async () => {
            await expect(slicerHarness.initialize([{
                lastSlice,
                slicer_id: 0,
            }])).resolves.not.toThrow();
        });

        it('should throw if recovery data is malformed', async () => {
            expect.assertions(1);

            try {
                // @ts-expect-error
                await slicerHarness.initialize(['asdfasdfasdf']);
            } catch (err) {
                expect(err).toBeDefined();
            }
        });

        it('can recovery to previous count', async () => {
            const expectedResults = { count: 26 };

            await slicerHarness.initialize([{
                lastSlice,
                slicer_id: 1,
            }]);

            const [results] = await slicerHarness.createSlices();
            expect(results).toEqual(expectedResults);
        });
    });

    describe('can work with parallel-slicers', () => {
        let slicerHarness: SlicerTestHarness;

        afterEach(async () => {
            if (slicerHarness) await slicerHarness.shutdown();
        });

        async function makeTest(numOfSlicers = 1, mode = 'once' as LifeCycle): Promise<SlicerTestHarness> {
            const job = newTestJobConfig();
            job.analytics = true;
            job.lifecycle = mode;
            job.slicers = numOfSlicers;
            job.operations = [
                {
                    _op: 'parallel-reader',
                },
                {
                    _op: 'noop',
                }
            ];

            slicerHarness = new SlicerTestHarness(job, {
                assetDir
            });

            await slicerHarness.initialize();

            return slicerHarness;
        }

        it('can run with a single slicer', async () => {
            const test = await makeTest();

            expect(await test.createSlices()).toEqual([{ count: 2, id: 0 }]);
            expect(test.slicer<ParallelSlicer>().isFinished).toEqual(false);

            expect(await test.createSlices()).toEqual([{ count: 1, id: 0 }]);
            expect(test.slicer<ParallelSlicer>().isFinished).toEqual(false);

            expect(await test.createSlices()).toEqual([null]);
            expect(test.slicer<ParallelSlicer>().isFinished).toEqual(true);

            expect(await test.createSlices()).toEqual([null]);
            expect(test.slicer<ParallelSlicer>().isFinished).toEqual(true);
        });

        it('can run with a multiple slicers', async () => {
            const slicerOneResults = [{ count: 2, id: 0 }, { count: 1, id: 0 }];
            const slicerTwoResults = [{ count: 2, id: 1 }, { count: 1, id: 1 }];

            const test = await makeTest(2);

            const sliceResults = uniq(await test.getAllSlices({ fullResponse: true }))
                .filter(Boolean) as Record<string, any>[];

            const slicerOne = sliceResults.filter((obj) => obj.slicer_id === 0);
            const slicerTwo = sliceResults.filter((obj) => obj.slicer_id === 1);

            expect(slicerOne).toBeArrayOfSize(2);
            expect(slicerTwo).toBeArrayOfSize(2);

            slicerOne.forEach((result, index) => {
                expect(result.slicer_id).toEqual(0);
                expect(result.slicer_order).toEqual(index + 1);
                expect(result.request).toEqual(slicerOneResults[index]);
            });

            slicerTwo.forEach((result, index) => {
                expect(result.slicer_id).toEqual(1);
                expect(result.slicer_order).toEqual(index + 1);
                expect(result.request).toEqual(slicerTwoResults[index]);
            });
        });

        it('getAllSlices will throw if not in once mode', async () => {
            await makeTest(2, 'persistent');
            await expect(slicerHarness.getAllSlices()).toReject();
        });
    });
});
