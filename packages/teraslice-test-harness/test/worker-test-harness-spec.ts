import 'jest-extended';
import path from 'path';
import { newTestJobConfig, newTestSlice, DataEntity, Fetcher, BatchProcessor, NoopProcessor } from '@terascope/job-components';
import { WorkerTestHarness } from '../src';

describe('WorkerTestHarness', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    },
                },
            }),
        },
    ];

    describe('when given a valid job config', () => {
        const job = newTestJobConfig({
            max_retries: 2,
            analytics: true,
            operations: [
                {
                    _op: 'test-reader',
                },
                {
                    _op: 'noop',
                },
            ],
        });

        const workerHarness = new WorkerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients,
        });

        workerHarness.processors[0].handle = jest.fn(async (data: DataEntity[]) => {
            return data;
        });

        it('should be able to call initialize', () => {
            return expect(workerHarness.initialize()).resolves.toBeNil();
        });

        it('should have fetcher', () => {
            expect(workerHarness.fetcher()).toBeInstanceOf(Fetcher);
        });

        it('should have on processor', () => {
            expect(workerHarness.processors).toBeArrayOfSize(1);
            expect(workerHarness.processors[0]).toBeInstanceOf(BatchProcessor);
        });

        it('should be able to call runSlice', async () => {
            const result = await workerHarness.runSlice(newTestSlice());
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should be able to call runSlice with just a request object', async () => {
            const result = await workerHarness.runSlice({ hello: true });
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should call slice retry', async () => {
            const onSliceRetryEvent = jest.fn();
            workerHarness.events.on('slice:retry', onSliceRetryEvent);
            const err = new Error('oh no');

            workerHarness.processors[0].handle
                // @ts-ignore
                .mockClear()
                // @ts-ignore
                .mockRejectedValueOnce(err)
                // @ts-ignore
                .mockRejectedValueOnce(err);

            const results = await workerHarness.runSlice({});
            expect(results).toBeArray();

            expect(onSliceRetryEvent).toHaveBeenCalledTimes(2);
            expect(workerHarness.getOperation<NoopProcessor>('noop').handle).toHaveBeenCalledTimes(3);
        });

        it('should be able to call runSlice with fullResponse', async () => {
            const result = await workerHarness.runSlice(newTestSlice(), { fullResponse: true });
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });

        it('should be able to call shutdown', () => {
            return expect(workerHarness.shutdown()).resolves.toBeNil();
        });
    });

    describe('when using static method testProcessor', () => {
        const options = { assetDir: path.join(__dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testProcessor({ _op: 'noop' }, options);
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should return an instance of the test harness', () => {
            expect(harness).toBeInstanceOf(WorkerTestHarness);
        });

        it('should be able run a slice', async () => {
            const data = [{ some: 'data' }];
            const results = await harness.runSlice(data);

            expect(results).toEqual(data);
        });
    });

    describe('when using static method testFetcher', () => {
        const options = { assetDir: path.join(__dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testFetcher(
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                options
            );
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should return an instance of the test harness', () => {
            expect(harness).toBeInstanceOf(WorkerTestHarness);
        });

        it('should be able to run a slice', async () => {
            const data = [{ some: 'data' }];
            const results = await harness.runSlice(data);

            expect(results).toEqual(data);
        });
    });

    describe('when testing flush', () => {
        const options = { assetDir: path.join(__dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testProcessor({ _op: 'simple-flush' }, options);
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should flush any remaining records', async () => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const emptyResults = await harness.runSlice(data);
            expect(emptyResults).toEqual([]);

            const flushedResults = await harness.flush();
            expect(flushedResults).toEqual(data);
        });
    });

    describe('when testing flush with analytics', () => {
        const options = { assetDir: path.join(__dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            const job = newTestJobConfig({
                max_retries: 0,
                analytics: true,
                operations: [
                    {
                        _op: 'test-reader',
                        passthrough_slice: true,
                    },
                    { _op: 'simple-flush' },
                ],
            });

            harness = new WorkerTestHarness(job, options);

            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should able return the result with analytics', async () => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const emptyResults = await harness.runSlice(data);
            expect(emptyResults).toEqual([]);

            const flushedResults = await harness.flush({ fullResponse: true });

            expect(flushedResults).toHaveProperty('results', data);
            expect(flushedResults).toHaveProperty('status', 'flushed');
            expect(flushedResults).toHaveProperty('analytics');
            expect(flushedResults!.analytics).toContainKeys(['time', 'memory', 'size']);
        });
    });
});
