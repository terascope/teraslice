import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    Slicer
} from '@terascope/job-components';
import { SlicerTestHarness } from '../src';
import ParallelSlicer from './fixtures/asset/parallel-reader/slicer';

describe('SlicerTestHarness', () => {
    const assetDir = path.join(__dirname, 'fixtures');
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

        const slicerHarness = new SlicerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients,
        });

        it('should be able to call initialize', () => expect(slicerHarness.initialize()).resolves.toBeNil());

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

        it('should have a slicer', () => {
            expect(slicerHarness.slicer()).toBeInstanceOf(Slicer);
        });

        it('should be able to call createSlices', async () => {
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
    });

    describe('when given a slicer that is recoverable', () => {
        let slicerHarness: SlicerTestHarness;

        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'recoverable-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const lastSlice = {
            count: 25
        };

        beforeEach(() => {
            slicerHarness = new SlicerTestHarness(job, {
                assetDir
            });
        });

        afterEach(async () => {
            await slicerHarness.shutdown();
        });

        it('should not throw if given recovery data', async () => {
            await slicerHarness.initialize([{
                lastSlice,
                slicer_id: 0,
            }]);
        });

        it('should throw if recovery data is malformed', async () => {
            expect.assertions(1);
            const badRecoveryData = { some: 'stuff' };
            // @ts-expect-error this one does not throw
            await slicerHarness.initialize([badRecoveryData]);

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

        async function makeTest(numOfSlicers = 1): Promise<SlicerTestHarness> {
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

        fit('can run with a multiple slicers', async () => {
            const test = await makeTest(2);

            const results = await test.getAllSlices();
            console.log('results', results)
            expect(results).toEqual('hello')
        });
    });
});
